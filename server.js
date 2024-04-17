const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "cs1.ucc.ie",
  user: "tl15",
  password: "kupho",
  database: "cs2208_tl15",
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Hello from the Backend!" });
});

// Get all workouts
app.get("/workouts", (req, res) => {
  db.query("SELECT * FROM Workout", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(data);
  });
});

// Get specific workout by ID
app.get("/workout/:workoutId", (req, res) => {
  const workoutId = req.params.workoutId;
  db.query(
    "SELECT * FROM Workout WHERE WorkoutID = ?",
    [workoutId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }
      if (result.length === 0) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(result[0]);
    }
  );
});

// Get workouts for a specific user and date
app.get("/get-days-workouts", (req, res) => {
  const { date, userID } = req.query;
  db.query(
    "SELECT * FROM Workout WHERE UserID = ? AND Date = ?",
    [userID, date],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }
      if (result.length === 0) {
        return res.status(404).json({ error: "No workouts found" });
      }
      res.json(result);
    }
  );
});

// Get workout content by workout ID
app.get("/workoutcontent/:workoutId", (req, res) => {
  const workoutId = req.params.workoutId;
  db.query(
    "SELECT * FROM WorkoutContents WHERE WorkoutID = ?",
    [workoutId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
      }
      res.json(result.length > 0 ? result : []);
    }
  );
});

// Get all workouts for a specific user
app.get("/workouts/user/:userId", (req, res) => {
  const userId = req.params.userId;
  db.query("SELECT * FROM Workout WHERE UserId = ?", [userId], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(data);
  });
});

// Get user by ID
app.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;
  db.query("SELECT * FROM Users WHERE UserId = ?", [userId], (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(data);
  });
});

// Get exercises by category or all if no category specified
app.get("/exercises", (req, res) => {
  const { category } = req.query;
  const sql = category
    ? "SELECT * FROM ExerciseLibrary WHERE Category = ?"
    : "SELECT * FROM ExerciseLibrary";
  db.query(sql, category ? [category] : [], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error fetching exercises" });
    }
    res.json(results);
  });
});

// Get exercise name by ID
app.get("/exercisename/:exerciseId", (req, res) => {
  const exerciseId = req.params.exerciseId;
  db.query(
    "SELECT Name FROM ExerciseLibrary WHERE ExerciseID = ?",
    [exerciseId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error fetching the exercise" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Exercise not found" });
      }
      res.json(results[0]);
    }
  );
});

// Get distinct exercise categories
app.get("/exercise-categories", (req, res) => {
  db.query("SELECT DISTINCT Category FROM ExerciseLibrary", (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Server error fetching categories" });
    }
    res.json(result);
  });
});

// Get food logs by date, userID, and meal type
app.get("/foodlog", (req, res) => {
  const { date, userID, mealType } = req.query;
  const query = `
    SELECT FoodLog.*, FoodLibrary.Name 
    FROM FoodLog
    JOIN FoodLibrary ON FoodLog.FoodID = FoodLibrary.FoodID
    WHERE FoodLog.Date = ? AND FoodLog.UserID = ? AND FoodLog.MealType = ?`;
  db.query(query, [date, userID, mealType], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "No food entries found" });
    }
    res.json(results);
  });
});

// Get foods by name search or all if no name specified
app.get("/foods", (req, res) => {
  const { name, barcode } = req.query;
  let query,
    queryParams = [];
  if (name && barcode) {
    query = "SELECT * FROM FoodLibrary WHERE Name LIKE ? AND Barcode = ?";
    queryParams.push(`%${name}%`, barcode);
  } else if (name) {
    query = "SELECT * FROM FoodLibrary WHERE Name LIKE ?";
    queryParams.push(`%${name}%`);
  } else if (barcode) {
    query = "SELECT * FROM FoodLibrary WHERE Barcode = ?";
    queryParams.push(barcode);
  } else {
    query = "SELECT * FROM FoodLibrary";
  }
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error searching for foods:", err);
      return res.status(500).json({ message: "Error searching for foods" });
    }
    res.json(results);
  });
});

// Get specific food by ID
app.get("/food/:foodID", (req, res) => {
  const { foodID } = req.params;
  if (!foodID) {
    return res.status(400).json({ error: "FoodID is required" });
  }
  const query =
    "SELECT FoodID, Name, Calories, Protein, Carbohydrates, Fats, Amount FROM FoodLibrary WHERE FoodID = ?";
  db.query(query, [foodID], (error, results) => {
    if (error) {
      console.error("Error fetching food details:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: "Food not found" });
    }
  });
});

app.post("/createfood", (req, res) => {
  const { Name, Calories, Amount, Protein, Carbohydrates, Fats } = req.body;
  if (
    !Name ||
    Calories == null ||
    Amount == null ||
    Protein == null ||
    Carbohydrates == null ||
    Fats == null
  ) {
    return res
      .status(400)
      .send({ error: true, message: "Please provide complete food data" });
  }

  const query =
    "INSERT INTO FoodLibrary (Name, Calories, Amount, Protein, Carbohydrates, Fats) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [Name, Calories, Amount, Protein, Carbohydrates, Fats];

  db.query(query, values, (error, results, fields) => {
    if (error) {
      return res.status(500).send({
        error: true,
        message: "Database operation failed",
        detail: error.message,
      });
    }
    res.send({
      error: false,
      data: {
        insertId: results.insertId,
      },
      message: "Food item added successfully.",
    });
  });
});

// Calculate total calories for a user on a given date
app.get("/calories-sum", (req, res) => {
  const { userId, date } = req.query;
  const query = `
    SELECT SUM(fl.ServingQuantity * flb.Calories) AS totalCalories
    FROM FoodLog fl
    JOIN FoodLibrary flb ON fl.FoodID = flb.FoodID
    WHERE fl.UserID = ? AND fl.Date = ?
    GROUP BY fl.UserID`;
  db.query(query, [userId, date], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    if (results.length > 0) {
      res.json({
        totalCalories: parseFloat(results[0].totalCalories).toFixed(2),
      });
    } else {
      res
        .status(404)
        .json({ error: "No data found for the given parameters." });
    }
  });
});

// Create a new workout
app.post("/create-workout", (req, res) => {
  const { UserID, Name, Date } = req.body;
  const sql = "INSERT INTO Workout (UserID, Name, Date) VALUES (?, ?, ?)";
  db.query(sql, [UserID, Name, Date], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error creating workout entry" });
    }
    res.status(201).json({
      id: result.insertId,
      message: "Workout entry created successfully",
    });
  });
});

// Add food to the log
app.post("/add-food", (req, res) => {
  const { Date, UserID, FoodID, ServingQuantity, MealType } = req.body;
  const checkSql =
    "SELECT * FROM FoodLog WHERE Date = ? AND UserID = ? AND FoodID = ? AND MealType = ?";
  db.query(checkSql, [Date, UserID, FoodID, MealType], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.length > 0) {
      const updateSql =
        "UPDATE FoodLog SET ServingQuantity = ServingQuantity + ? WHERE Date = ? AND UserID = ? AND FoodID = ? AND MealType = ?";
      db.query(
        updateSql,
        [ServingQuantity, Date, UserID, FoodID, MealType],
        (err, result) => {
          if (err) {
            return res.status(500).json(err);
          }
          res.status(200).json({ message: "Food entry updated successfully" });
        }
      );
    } else {
      const insertSql =
        "INSERT INTO FoodLog (Date, UserID, FoodID, ServingQuantity, MealType) VALUES (?, ?, ?, ?, ?)";
      db.query(
        insertSql,
        [Date, UserID, FoodID, ServingQuantity, MealType],
        (err, result) => {
          if (err) {
            return res.status(500).json(err);
          }
          res.status(201).json({ message: "Food entry created successfully" });
        }
      );
    }
  });
});

// Create a new food item
app.post("/create-food", (req, res) => {
  const { Name, Calories, Macronutrients, Amount } = req.body;
  const sql =
    "INSERT INTO FoodLibrary (Name, Calories, Macronutrients, Amount) VALUES (?, ?, ?, ?)";
  db.query(sql, [Name, Calories, Macronutrients, Amount], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(201).json({ message: "Food item added successfully" });
  });
});

// Add an exercise to a workout
app.post("/add-exercise", (req, res) => {
  const { WorkoutID, ExerciseID } = req.body;
  const Reps = req.body.Reps || null;
  const Weight = req.body.Weight || null;
  const Notes = req.body.Notes || null;
  const sql =
    "INSERT INTO WorkoutContents (WorkoutID, ExerciseID, Reps, Weight, Notes) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [WorkoutID, ExerciseID, Reps, Weight, Notes], (err, result) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Error adding exercise to workout" });
    }
    res.status(201).json({
      message: "Exercise added to workout successfully",
      exerciseAdded: result.insertId,
    });
  });
});

// Update user details
app.put("/user/:id", (req, res) => {
  const { id } = req.params;
  const {
    Age,
    Gender,
    Height,
    Weight,
    ActivityLevel,
    WeightGoal,
    WorkoutGoal,
  } = req.body;
  const query = `
    UPDATE Users SET
    Age = ?,
    Gender = ?,
    Height = ?,
    Weight = ?,
    ActivityLevel = ?,
    WeightGoal = ?,
    WorkoutGoal = ?
    WHERE UserID = ?`;
  db.query(
    query,
    [Age, Gender, Height, Weight, ActivityLevel, WeightGoal, WorkoutGoal, id],
    (err, result) => {
      if (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({ message: "Error updating user details" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "User updated successfully" });
    }
  );
});

// Update workout details
app.put("/update-workout/:workoutId", (req, res) => {
  const { workoutId } = req.params;
  const { name, duration, notes } = req.body;
  let queryParts = [];
  let parameters = [];
  if (name !== undefined) {
    queryParts.push("Name = ?");
    parameters.push(name);
  }
  if (duration !== undefined) {
    queryParts.push("Duration = ?");
    parameters.push(duration);
  }
  if (notes !== undefined) {
    queryParts.push("Notes = ?");
    parameters.push(notes);
  }
  if (queryParts.length === 0) {
    return res.status(400).send("No update parameters provided.");
  }
  const setClause = queryParts.join(", ");
  const sql = `UPDATE Workout SET ${setClause} WHERE WorkoutID = ?`;
  parameters.push(workoutId);
  db.query(sql, parameters, (error, results) => {
    if (error) {
      console.error("Database operation failed:", error);
      return res.status(500).send("Error updating workout details.");
    }
    if (results.affectedRows === 0) {
      return res.status(404).send("Workout not found.");
    }
    res.send("Workout details updated successfully.");
  });
});

// Update workout content
app.put("/update-workout-content/:setID", (req, res) => {
  const { setID } = req.params;
  const { WorkoutID, ExerciseID, Reps, Weight, Notes } = req.body;
  let queryParts = [];
  let parameters = [];
  if (WorkoutID !== undefined) {
    queryParts.push("WorkoutID = ?");
    parameters.push(WorkoutID);
  }
  if (ExerciseID !== undefined) {
    queryParts.push("ExerciseID = ?");
    parameters.push(ExerciseID);
  }
  if (Reps !== undefined) {
    const repsValue = Reps === "" ? null : parseInt(Reps, 10);
    queryParts.push("Reps = ?");
    parameters.push(repsValue);
  }
  if (Weight !== undefined) {
    queryParts.push("Weight = ?");
    parameters.push(Weight);
  }
  if (Notes !== undefined) {
    queryParts.push("Notes = ?");
    parameters.push(Notes);
  }
  if (queryParts.length === 0) {
    return res.status(400).send("No update parameters provided.");
  }
  const setClause = queryParts.join(", ");
  const sql = `UPDATE WorkoutContents SET ${setClause} WHERE SetID = ?`;
  parameters.push(setID);
  db.query(sql, parameters, (error, results) => {
    if (error) {
      console.error("Database operation failed:", error);
      return res.status(500).send("Error updating WorkoutContents.");
    }
    if (results.affectedRows === 0) {
      return res.status(404).send("SetID not found.");
    }
    res.send("Workout content updated successfully.");
  });
});

// Delete a workout and its contents
app.delete("/delete-workout/:workoutID", (req, res) => {
  const { workoutID } = req.params;
  db.beginTransaction((err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res
        .status(500)
        .send("Server error during transaction initiation.");
    }
    db.query(
      "DELETE FROM WorkoutContents WHERE WorkoutID = ?",
      [workoutID],
      (error, results) => {
        if (error) {
          db.rollback(() => {
            console.error("Error deleting workout contents:", error);
          });
          return res
            .status(500)
            .send("Server error during workout contents deletion.");
        }
        db.query(
          "DELETE FROM Workout WHERE WorkoutID = ?",
          [workoutID],
          (error, results) => {
            if (error) {
              db.rollback(() => {
                console.error("Error deleting workout:", error);
              });
              return res
                .status(500)
                .send("Server error during workout deletion.");
            }
            db.commit((err) => {
              if (err) {
                db.rollback(() => {
                  console.error("Error committing transaction:", err);
                });
                return res
                  .status(500)
                  .send("Server error during transaction commit.");
              }
              res.send("Workout successfully deleted.");
            });
          }
        );
      }
    );
  });
});

// Delete a workout set
app.delete("/delete-set/:SetID", (req, res) => {
  const { SetID } = req.params;
  if (!SetID) {
    return res.status(400).send("SetID is required");
  }
  const query = "DELETE FROM WorkoutContents WHERE SetID = ?";
  db.query(query, [SetID], (error, results) => {
    if (error) {
      console.error("Failed to delete set:", error);
      return res.status(500).send("Failed to delete the set");
    }
    if (results.affectedRows === 0) {
      return res.status(404).send("Set not found");
    }
    res.send("Set deleted successfully");
  });
});

// Delete a food item from the food log
app.delete("/delete-food-item", (req, res) => {
  const { date, userID, foodID, mealType } = req.body;
  if (!date || !userID || !foodID || !mealType) {
    return res.status(400).json({
      error: "All parameters (date, userID, foodID, mealType) are required.",
    });
  }
  const query =
    "DELETE FROM FoodLog WHERE Date = ? AND UserID = ? AND FoodID = ? AND MealType = ?";
  db.query(query, [date, userID, foodID, mealType], (error, results) => {
    if (error) {
      console.error("Failed to delete food entry:", error);
      return res
        .status(500)
        .json({ error: "Failed to delete the food entry." });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Food entry not found." });
    }
    res.json({ message: "Food entry deleted successfully." });
  });
});

app.listen(8082, () => {
  console.log("Server listening on port 8082");
});
