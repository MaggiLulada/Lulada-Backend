const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { identifyLanguage } = require("../translations");
const { userEnrolledWorkout } = require("./user");
const corsHandler = cors({ origin: true });


exports.onLineWorkout = functions.https.onRequest((request, response) => {
    corsHandler(request, response, () => {

        const data = request.body;
        const topic = request.body.id //id workout_schedule
        const language = identifyLanguage(request.body.language)

        const payload = {
            notification:{
                title: language.instructor_workout_online,
                body: language.instructor_workout_online,
                priority: 'high'
            }
        }

        return admin.messaging().sendToTopic(topic, payload)
    })
})

exports.userEnrolledWorkout = functions.https.onRequest((request, response) => {
    corsHandler(request, response, () => {

        const data = request.body;
        const topic = request.body.id //id workout_schedule
        const language = request.body.language
        const user = request.body.payer_info
        const extra = request.body.extra

        console.log(user.tokens, 'tokenssssss')
        user.tokens.forEach((token, index) => (
            console.log(`token ${index}: ${token}`)
        ))
        
        if (language == 'en') {
            const payloadInstructor = {
                notification:{
                    title: `${user.name} is in!`,
                    body:'Your workout is growing.',
                    priority: 'high'
                },
                data:{
                    link:"lulada://Workouts/Initial/UpcomingWorkouts"
                }
            }
            return (
                admin.firestore().collection("Notifications")
                .add({
                    ...payloadInstructor.notification,
                    user: extra.user.id,
                    extra: extra,
                    date: admin.firestore.FieldValue.serverTimestamp()
                }),
                admin.messaging().sendToTopic(topic, payloadInstructor),
                userEnrolledWorkout(data) // Send notification user/participant
            )

    
        } else {
            const payloadInstructor = {
                notification:{
                    title: `${user.name} ist dabei!`,
                    body: 'Dein Training wächst.',
                    priority: 'high'
                },
                data:{
                    link:"lulada://Workouts/Initial/UpcomingWorkouts"
                }
            }
            return (
                admin.firestore().collection("Notifications")
                .add({
                    ...payloadInstructor.notification,
                    user: user.id,
                    extra: extra,
                    date: admin.firestore.FieldValue.serverTimestamp()
                }),
                admin.messaging().sendToTopic(topic, payloadInstructor),
                userEnrolledWorkout(data)// Send notification user/participant
            )
        }
       
    })
})