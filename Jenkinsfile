
pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = '385723258875'
        ECR_REPOSITORY = 'pgl-app'
        IMAGE_TAG = 'latest'
        EC2_HOST = '3.108.250.95'

        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_IMAGE = "${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                powershell 'npm ci'
            }
        }

        stage('Build Docker Image') {
            steps {
                powershell 'docker build -t $env:ECR_IMAGE .'
            }
        }

        stage('Login to AWS ECR') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'aws-credentials',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    powershell '''
                        $env:AWS_DEFAULT_REGION = $env:AWS_REGION

                        aws sts get-caller-identity

                        if ($LASTEXITCODE -ne 0) {
                            throw "AWS authentication failed"
                        }

                        $password = aws ecr get-login-password --region $env:AWS_REGION

                        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($password)) {
                            throw "ECR password generation failed"
                        }

                        $password | docker login --username AWS --password-stdin $env:ECR_REGISTRY

                        if ($LASTEXITCODE -ne 0) {
                            throw "Docker ECR login failed"
                        }
                    '''
                }
            }
        }

        stage('Push Image to ECR') {
            steps {
                powershell '''
                    docker push $env:ECR_IMAGE

                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker push failed"
                    }
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: 'ec2-ssh-key',
                        keyFileVariable: 'SSH_KEY',
                        usernameVariable: 'SSH_USER'
                    )
                ]) {
                    powershell '''
                        $remote = "$env:SSH_USER@$env:EC2_HOST"

                        $remoteCommand = "set -e; aws ecr get-login-password --region ap-south-1 | sudo docker login --username AWS --password-stdin 385723258875.dkr.ecr.ap-south-1.amazonaws.com; sudo docker pull 385723258875.dkr.ecr.ap-south-1.amazonaws.com/pgl-app:latest; sudo docker rm -f pgl-app || true; sudo docker run -d --name pgl-app --restart unless-stopped -p 3000:3000 385723258875.dkr.ecr.ap-south-1.amazonaws.com/pgl-app:latest"

                        ssh -i "$env:SSH_KEY" -o StrictHostKeyChecking=accept-new $remote $remoteCommand

                        if ($LASTEXITCODE -ne 0) {
                            throw "EC2 deployment failed"
                        }
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Application deployed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
    }
}
