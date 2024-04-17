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

app.get("/", (req, res) => {
  return res.json("Hello from the Backend!");
});

app.get("/workouts", (req, res) => {
  const sql = "SELECT * FROM Workout";
  db.query(sql, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/workout/:workoutId", (req, res) => {
  const workoutId = req.params.workoutId;

  const sqlQuery = "SELECT * FROM Workout WHERE WorkoutID = ?";

  db.query(sqlQuery, [workoutId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }
    if (result.length === 0) {
      return res.status(404).send("Workout not found");
    }
    res.json(result[0]);
  });
});

app.get("/get-days-workouts", (req, res) => {
  const { date, userID } = req.query;
  const sqlQuery = "SELECT * FROM Workout WHERE UserID = ? AND Date = ?";

  db.query(sqlQuery, [userID, date], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Workout not found" });
    }
    res.json(result);
  });
});

app.get("/workoutcontent/:workoutId", (req, res) => {
  const workoutId = req.params.workoutId;

  const sqlQuery = "SELECT * FROM WorkoutContents WHERE WorkoutID = ?";

  db.query(sqlQuery, [workoutId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }
    if (result.length === 0) {
      return res.json([]);
    } else {
      res.json(result);
    }
  });
});

app.get("/workouts/user/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM Workout WHERE UserId = ?";
  db.query(sql, userId, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM Users WHERE UserId = ?";
  db.query(sql, userId, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.get("/exercises", (req, res) => {
  // The category is expected to be passed as a query parameter, e.g., /exercises?category=Chest
  const { category } = req.query;

  if (!category) {
    const sql = "SELECT * FROM ExerciseLibrary";
    db.query(sql, [category], (err, results) => {
      if (err) {
        console.error("An error occurred while fetching exercises:", err);
        return res
          .status(500)
          .send("An error occurred while fetching exercises");
      }

      res.json(results);
    });
  }

  const sql = "SELECT * FROM ExerciseLibrary WHERE Category = ?";
  db.query(sql, [category], (err, results) => {
    if (err) {
      console.error("An error occurred while fetching exercises:", err);
      return res.status(500).send("An error occurred while fetching exercises");
    }

    res.json(results);
  });
});

app.get("/exercisename/:exerciseId", (req, res) => {
  const exerciseId = req.params.exerciseId;

  const query = "SELECT Name FROM ExerciseLibrary WHERE ExerciseID = ?";

  db.query(query, [exerciseId], (err, results) => {
    if (err) {
      console.error("Error fetching the exercise:", err);
      return res.status(500).send("Error fetching the exercise");
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send("Exercise not found");
    }
  });
});

app.get("/exercise-categories", (req, res) => {
  // Prepare the SQL query to select the unique categories from the ExerciseLibrary table
  const sql = "SELECT DISTINCT Category FROM ExerciseLibrary";

  // Execute the query
  db.query(sql, (err, result) => {
    if (err) {
      // If there's an error, return it in the response
      return res.status(500).json(err);
    }
    // If successful, send back the result which should be the exclusive list of categories
    res.status(200).json(result);
  });
});

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
      return res
        .status(404)
        .json({ message: "No entries found for the specified criteria" });
    }

    res.json(results);
  });
});

app.get("/foods", (req, res) => {
  const { name } = req.query;
  let query;
  let queryParams = [];

  if (!name) {
    query = "SELECT * FROM FoodLibrary";
  } else {
    query = "SELECT * FROM FoodLibrary WHERE name LIKE ? LIMIT 20";
    queryParams.push(`%${name}%`);
  }
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error searching for foods:", err);
      return res.status(500).json({ message: "Error searching for foods" });
    }
    res.json(results);
  });
});

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

app.get("/calories-sum", (req, res) => {
  const { userId, date } = req.query;

  const query = `
    SELECT SUM(fl.ServingQuantity * flb.Calories) AS totalCalories
    FROM FoodLog fl
    JOIN FoodLibrary flb ON fl.FoodID = flb.FoodID
    WHERE fl.UserID = ? AND fl.Date = ?
    GROUP BY fl.UserID
  `;

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
        .json({ message: "No data found for the given parameters." });
    }
  });
});

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

app.post("/add-food", (req, res) => {
  // Destructure the food log data from the request body
  const { Date, UserID, FoodID, ServingQuantity, MealType } = req.body;

  // First, check if there's already an entry with the same Date, UserID, FoodID, and MealType
  const checkSql =
    "SELECT * FROM FoodLog WHERE Date = ? AND UserID = ? AND FoodID = ? AND MealType = ?";

  db.query(checkSql, [Date, UserID, FoodID, MealType], (err, result) => {
    if (err) {
      // If there's an error executing the query, return it in the response
      return res.status(500).json(err);
    }

    if (result.length > 0) {
      // Entry exists, so increment the ServingQuantity
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
      // No entry exists, insert a new record
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

app.post("/create-food", (req, res) => {
  const { Name, Calories, Macronutrients, Amount } = req.body;

  // SQL query to insert the new food item into the FoodItems table
  const sql =
    "INSERT INTO FoodLibrary (Name, Calories, Macronutrients, Amount) VALUES (?, ?, ?, ?)";

  // Execute the query
  db.query(sql, [Name, Calories, Macronutrients, Amount], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    // If successful, send back a success response
    res.status(201).json({ message: "Food item added successfully" });
  });
});

app.post("/add-exercise", (req, res) => {
  // Extracting WorkoutID and ExerciseID from the request body
  const { WorkoutID, ExerciseID } = req.body;

  const Reps = req.body.Reps || null;
  const Weight = req.body.Weight || null;
  const Notes = req.body.Notes || null;

  // SQL Query to insert the new record into the WorkoutContents table
  const sql =
    "INSERT INTO WorkoutContents (WorkoutID, ExerciseID, Reps, Weight, Notes) VALUES (?, ?, ?, ?, ?)";

  // Executing the query
  db.query(sql, [WorkoutID, ExerciseID, Reps, Weight, Notes], (err, result) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Error adding exercise to workout" });
    }
    // Sending a success response
    res.status(201).json({
      message: "Exercise added to workout successfully",
      exerciseAdded: result.insertId,
    });
  });
});

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

  // Execute the query
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

app.put("/update-workout/:workoutId", (req, res) => {
  const { workoutId } = req.params;
  const { name, duration, notes } = req.body; // Destructure the workout details from the request body

  // Build the SQL query dynamically based on provided fields
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
  parameters.push(workoutId); // Add workoutId to the parameters array for the WHERE clause

  db.query(sql, parameters, (error, results) => {
    if (error) {
      console.error("Database operation failed:", error);
      return res.status(500).send("Error updating workout details.");
    }

    if (results.affectedRows === 0) {
      // No rows were updated, which might mean the workoutId doesn't exist
      return res.status(404).send("Workout not found.");
    }

    res.send("Workout details updated successfully.");
  });
});

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

  const setClause = queryParts.join(", ");
  // Ensure there is at least one field to update
  if (queryParts.length === 0) {
    return res.status(400).send("No update parameters provided.");
  }

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
  });
});

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

app.delete("/delete-food-item", (req, res) => {
  const { date, userID, foodID, mealType } = req.body;

  if (!date || !userID || !foodID || !mealType) {
    // Sending error as JSON
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
  console.log("listening on 8082");
});
