import express from "express";
import cors from "cors";
import sql from "mssql";
import cookieParser from "cookie-parser";
import { generateToken, verifyToken, verifyUser } from "./auth.js";

const app = express();
const port = 3003;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000"],
  })
);

app.get("/get_users", async (req, res) => {
  try {
    await sql.connect(process.env.SQL_STRING);

    const result = await sql.query`select * from users order by id desc`;

    const access_user = await sql.query`SELECT * FROM access`;

    res.json(
      result.recordset.map((record) => ({
        ...record,
        access_user,
        key: record.id,
        tags: ["aaaa", "bbb"],
      }))
    );
  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

app.post("/give_access", async (req, res) => {
  try {
    const { projects, users_id } = req.body;

    await sql.connect(process.env.SQL_STRING);

    const result =
      await sql.query`SELECT users_id2 FROM access WHERE projects = ${projects}`;

    let str = result.recordset[0].users_id2.split(" ");

    var users_id3 = "" + users_id;

    let found = str.indexOf(users_id3);

    let new_str = str.push(users_id3);

    let str2 = str.join(" ");

    if (found != -1) {
      console.log("Этот доступ уже есть!");
    } else {
      await sql.query`UPDATE access SET users_id2=${str2} WHERE projects=${projects}`;
      console.log("Доступ дан!");
    }

    res.json({});
  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

app.post("/remove_access", async (req, res) => {
  try {
    const { projects, users_id } = req.body;

    await sql.connect(process.env.SQL_STRING);

    const result =
      await sql.query`SELECT users_id2 FROM access WHERE projects = ${projects}`;

    let str = result.recordset[0].users_id2.split(" ");

    var users_id3 = "" + users_id;

    let found = str.indexOf(users_id3);

    if (found != -1) {
      str.splice(found, 1).join(" ");

      let str2 = str.join(" ");

      console.log(str2);
      await sql.query`UPDATE access SET users_id2=${str2} WHERE projects=${projects}`;
      console.log("Доступ удалён!");
    } else {
      console.log("Доступа нет!");
    }

    res.json({});
  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  try {
    await sql.connect(process.env.SQL_STRING);

    const result =
      await sql.query`SELECT TOP(1) * FROM users WHERE login=${login} AND password=${password}`;

    if (result.recordset.length) {
      const user = result.recordset[0];

      const token = await generateToken(user.id);

      res.cookie("token", token, {
        secure: false,
        sameSite: "lax",
        httpOnly: false,
      });

      res.json(user);
    } else {
      res.json({});
    }
  } catch (err) {
    console.log(err);
    res.json({});
  }
});

app.get("/get_user", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await sql.connect(process.env.SQL_STRING);
    const result =
      await sql.query`SELECT login, password, first_name, middle_name FROM users WHERE id = ${userId}`;

    if (result.recordset.length) {
      const user = result.recordset[0];

      res.json(user);
    } else {
      res.json({});
    }
  } catch (err) {
    console.log(err);
    res.json({});
  }
});

app.get("/logout", async (req, res) => {
  res.cookie("token", "");

  res.status(200).json({});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
