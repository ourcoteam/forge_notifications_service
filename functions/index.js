const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getDatabase } = require("firebase-admin/database");

const fb = initializeApp({
    credential: applicationDefault(),
    databaseURL: 'https://laravel-forge-ac6ae-default-rtdb.firebaseio.com/'
});

const db = getDatabase(fb);

const app = express();

app.use(helmet());

app.use(bodyParser.urlencoded({
    extended: true,
}));

app.use(bodyParser.json());

app.use(cors());

async function getFcmTokens() {
    return await db.ref('tokens').once('value').then((snapshot) => snapshot.val() ?? []);
};
// function setTokens(tokens) {
//     db.ref("tokens").set(tokens, function (error) {
//         if (error) {
//             console.log("Failed with error: " + error)
//         } else {
//             console.log("success")
//         }
//     });
// }

// db.ref('tokens').on('value', (snapshot) => {
//     const val = snapshot.val();
//     console.log(val);
//     if (val == null) {
//         fcmTokens = [];
//     } else {
//         fcmTokens = val;
//     }
// });

// app.get('/', (req, res) => {
//     res.send('Hello');
// });

// app.post('/fcm_token', (req, res) => {
//     const token = req.body.token;
//     if (!fcmTokens.includes(token)) {
//         setTokens([...fcmTokens, token]);
//     }
//     res.send({
//         "status": "success",
//     });
// });

// app.delete('/fcm_token', (req, res) => {
//     const token = req.body.token;
//     if (fcmTokens.includes(token)) {
//         setTokens([...fcmTokens.filter((e) => e != token)]);
//     }
//     res.send({
//         "status": "success",
//     });
// });

// app.get('/fcm_tokens', async (req, res) => {
//     const fcmTokens = await getFcmTokens();
//     res.send({
//         "tokens": fcmTokens,
//     });
// });

app.post('/new_deployment', async (req, res) => {
    const fcmTokens = await getFcmTokens();
    if (fcmTokens.length > 0) {
        const body = req.body;
        const data = {
            "status": `${body.status}`,
            "server_id": `${body.server?.id}`,
            "server_name": `${body.server?.name}`,
            "site_id": `${body.site?.id}`,
            "site_name": `${body.site?.name}`,
            "commit_hash": `${body.commit_hash}`,
            "commit_url": `${body.commit_url}`,
            "commit_author": `${body.commit_author}`,
            "commit_message": `${body.commit_message}`
        };

        const message = {
            data: data,
            tokens: [...fcmTokens],
        };

        getMessaging().sendMulticast(message)
            .then((response) => {
                res.send({
                    "status": "success",
                });
            })
            .catch((error) => {
                console.log('Error sending message:', error);
                res.send({
                    "status": "failed",
                    // "error": error,
                });
            });
    } else {
        res.send({
            "status": "empty",
        })
    }
});

//app.listen(1337, () => {
//    console.log('listening on port 1337');
//});

exports.app = functions.https.onRequest(app);
