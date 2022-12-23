const functions = require("firebase-functions");
const admin = require("firebase-admin");


exports.userEnrolledWorkout = (data) => {


    const language = data.language
    const workout_name = data.extra.name
    const tokensUser = data.payer_info.tokens
    const tokens = []

    tokensUser.forEach((token, index) => (
        tokens.push(token)
    ))

    const resultsTokens = tokens.filter(element => { // Exclude tokens null
        return element !== null
    })

    if (language == 'en') {
        const payloadUser = {
            notification:{
                title: 'You are in!',
                body:`You successfully joined ${workout_name}`,
                priority: 'high'
            },
            data:{
                link:"lulada://Workouts/Initial/UpcomingWorkouts"
            }
        }
        return (
            admin.firestore().collection("Notifications")
            .add({
                ...payloadUser.notification,
                user: data.payer_info.id,
                extra: data.extra,
                date: admin.firestore.FieldValue.serverTimestamp()
            }),
            
            admin.messaging().sendToDevice(resultsTokens, payloadUser)
        )


    } else {
        const payloadUser = {
            notification:{
                title: 'Du bist dabei!',
                body: `Du nimmst an ${workout_name} Teil.`,
                priority: 'high'
            },
            data:{
                link:"lulada://Workouts/Initial/UpcomingWorkouts"
            }
        }
        return (
            admin.firestore().collection("Notifications")
            .add({
                ...payloadUser.notification,
                user: data.payer_info.id,
                extra: data.extra,
                date: admin.firestore.FieldValue.serverTimestamp()
            }),
            admin.messaging().sendToDevice(resultsTokens, payloadUser)
        )
    }

}