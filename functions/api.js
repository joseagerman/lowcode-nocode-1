const express = require("express");
const cors = require("cors");
const axios = require("axios")

// Inicializacion Firestore Database
//var passwords = require("./cert.json");
// const admin = require("firebase-admin");

var passwords = require("./cert.json");
const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(passwords)
});

//admin.initializeApp();

const db = admin.firestore();
const auth = admin.auth();
const app = express();
app.use(cors());
app.use(express.json());
const port = 3002;


// Este metodo se encarga de decidir si un usuario puede acceder o no
const authentication = async (token) => {
  // Me tengo que conectar con firebase y preguntarle si el token que me han pasado es correcto o no es correcto.
  console.log("Metodo autenticacion", token);
  try {
    const respuesta = await auth.verifyIdToken(token);
    // Dins de la resposta hi ha una propietat email
    const email = respuesta.email
    console.log('email', email)

    // SI es l'usuari juanito@gmail.com no pot accedir per aixo retorno false altramanera poden accedir
    if(email === "juanito@gmail.com"){
      return false
    }else{
      return true
    }
   
  } catch (e) {
    // Si hemos llegado a este bloque es porque el metodo verifyIdToken dio error
    // Es decir el usuario o el token o lo que sea no era correcto
    return false;
  }

  // SI es correcto devuelvo un true y si no es correcto devuelvo un false
};


// Middleware que s'encarrega de comprobar avans que entrin en joc els endpoints si l'usuari pot accedir o no
app.use( async (req, res, next) => {
  if (! req.headers.authorization) {
    return res.status(403).json({ error: 'No has añadido token!' });
  }

  // SI llego aqui es porque si me han añadido un token.
  const token = req.headers.authorization

  // Le paso el token al metodo authentication que me dira si puede pasar o no
  const puedePasar = await authentication(token);

  // Si no puede pasar, le diremos que "No estas autorizadoo a entrar"
  if (!puedePasar) {
    return res.status(401).send({ message: "No estás autorizado a entrar" });
  }else{
    // Aixó es un metode nadiu d'express que diu que puedes continuar
  next()
  }
    
});




// Endpoint del HOME
app.get("/", (req, res) => res.send("Hola mundo"));


// OPERACIONS Create Read Update Delete


// OPERACIO READ ALL USERS
app.get("/users", async (req, res) => {

  // COnexión con la base de datos para leer todos los usuarios
  const users = await db.collection("usuarios").get();

  // Mapeo la data para devolver solo el contenido que me interesa
  const dataUsers = users.docs.map((d) => d.data());

  // Devuelvo la petición al front
  res.send(dataUsers);
});

// OPERACIO READ ONE USER
app.get("/user/:id/", async (req, res) => {
  const id = req.params.id;

  //Conexión con la base de datos para leer la data de un usuario
  const user = await db.collection("usuarios").doc(id).get();
  res.send(user.data());
});


// OPERACIO CREATE ONE USER
app.post("/user", async (req, res) => {
  const user = req.body;

  // Conexión con la base de datos para enviarle un usuario nuevo
  await db.collection("usuarios").add(user);
  res.send({ result: "success" });
});


// OPERACIO UPDATE ONE USER AMB METODE PUT
app.put("/user/:id", async (req, res) => {
  // Primero tengo que coger la id del usuario que quiero updatear
  const id = req.params.id;

  // Segundo tengo que coger el object json con la data que quiero modificar
  const userToUpdate = req.body;

  // Conexión con la base de datos para updatear ese campo con esa id
  await db.collection("usuarios").doc(id).update(userToUpdate);

  res.send({ result: "success" });
});


// OPERACIO UPDATE ONE USER AMB METODE PATCH
app.patch("/user/:id", async (req, res) => {
  // Primero tengo que coger la id del usuario que quiero updatear
  const id = req.params.id;

  // Segundo tengo que coger el object json con la data que quiero modificar
  const userToUpdate = req.body;

  // Conexión con la base de datos para hacer un patch
  await db.collection("usuarios").doc(id).set(userToUpdate, { merge: true });

  res.send({ result: "success" });
});

// OPERACIO DELETE ONE USER
app.delete("/user/:id", async (req, res) => {
  const id = req.params.id;

  // Conexión con la base de datos para eliminar el documento que tiene esa id
  await db.collection("usuarios").doc(id).delete();

  res.send({ result: "success" });
});

app.listen(port, () => {
  console.log(`Desde api.js ${port}`);
});

//module.exports = app;
