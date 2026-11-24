

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const employees = [
    { id: 1, name: "Harsh", role: "DevOps Engineer" },
    { id: 2, name: "Rahul", role: "Backend Developer" },
    { id: 3, name: "Aman", role: "Frontend Developer" }
];

// Homepage
app.get("/", (req, res) => {
    res.send(`
        <h1>Employee Management System</h1>
        <h3>Node.js Application deployed using Jenkins</h3>
        <p>Visit /employees to see all employees.</p>
    `);
});

// Get all employees
app.get("/employees", (req, res) => {
    res.json(employees);
});

// Get employee by ID
app.get("/employees/:id", (req, res) => {
    const employee = employees.find(
        emp => emp.id === Number(req.params.id)
    );

    if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
});

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "UP" });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
