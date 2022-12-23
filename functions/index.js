const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const corsHandler = cors({ origin: true });
const paypal = require("@paypal/checkout-server-sdk");
const { captureWorkoutsForToday } = require("./src/workouts/index");


// Configure the SDK PayPal environment
const clientId = functions.config().paypal.client_id;
const secretKey = functions.config().paypal.secret_key;
const env = new paypal.core.SandboxEnvironment(clientId, secretKey);
const client = new paypal.core.PayPalHttpClient(env);
const newRequest = new paypal.orders.OrdersCreateRequest();


//
const {Storage} = require('@google-cloud/storage');
const BUCKET = 'lulada-a38cb.appspot.com'
const PdfPrinter = require('pdfmake')
const font = require('pdfmake/build/vfs_fonts.js');
const dayjs = require("dayjs");

admin.initializeApp(functions.config().firebase)


var fonts = {
	Roboto: {
        normal: Buffer.from(font.pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(font.pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(font.pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(font.pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
	}
};

exports.createWorkout = functions.https.onRequest((request, response) => {
    corsHandler(request, response, () => {

        const data = request.body;

        createWorkouts(data).then(res => {
            response.send(res);
        }).catch(error => {
            response.send(error);
        })

    })
})

function createWorkouts(data) {
    return new Promise((resolve, reject) => {

        const finalSchedule = []
        const compareFinalSchedule = []
        const workouts = data.workouts;

        for (let i = 0; i < workouts.length; i++) {
            const workout = workouts[i].workouts
            for (let j = 0; j < workout.length; j++) {
                const schedule = workout[j].schedules
                for (let k = 0; k < schedule.length; k++) {
                    finalSchedule.push({
                        startTime: schedule[k].startTime,
                        endTime: schedule[k].endTime,
                        date: workout[j].date,
                        day: workout[j].day,
                    })
                }  
            }
        }
     
        admin.firestore().collection("Workouts").add({
            name: data.name,
            pictures: data.pictures,
            directions: data.directions,
            location: data.location,
            date_workout: data.date_workout,
            start_time: data.start_time,
            end_time: data.end_time,
            description: data.description,
            cost: data.cost,
            created_at: admin.firestore.Timestamp.fromDate(new Date()),
            instructions: data.instructions,
            participants: data.participants,
            main_language: data.main_language,
            secondary_language: data.secondary_language,
            user: data.user,
            state: data.state,
            time_zone: data.time_zone
        })
        .then((res) => {
            finalSchedule.forEach(schedule => {
                admin.firestore().collection("Workouts_Schedule")
                .add({
                    workout: res.id,
                    start_time: schedule.startTime,
                    end_time: schedule.endTime,
                    date_start: dayjs(`${schedule.date} ${schedule.startTime}`).format('YYYY-MM-DD HH:mm'),
                    date_end: dayjs(`${schedule.date} ${schedule.endTime}`).format('YYYY-MM-DD HH:mm'),
                    date: schedule.date,
                    day: schedule.day,
                    state: data.state,
                    name: data.name,
                    pictures: data.pictures,
                    directions: data.directions,
                    location: data.location,
                    description: data.description,
                    cost: data.cost,
                    created_at: admin.firestore.Timestamp.fromDate(new Date()),
                    instructions: data.instructions,
                    participants: data.participants,
                    main_language: data.main_language,
                    secondary_language: data.secondary_language,
                    user: data.user,
                    time_zone: data.time_zone,
                    cancel:{
                        state:false,
                        description:'',
                        canceled_by:''
                    }
                }).then(response => {
                    captureWorkoutsForToday()
                    compareFinalSchedule.push({
                        id: response.id,
                        workout: res.id,
                    })
                }).catch(error => {
                    console.log(error)
                })
            })
            console.table(compareFinalSchedule)
            if (compareFinalSchedule.length === finalSchedule.length) {
                resolve('Workout created')
            } else {
                reject('Workout not created')
            }
        })
        .catch(err => {
            reject(err);
        })
    })
}

exports.paypalCreateOrder = functions.https.onRequest((request, response) => {
    corsHandler(request, response, () => {

        const data = request.body;

        console.log(data, 'data')

        newRequest.requestBody({
            "intent": "CAPTURE",
            "purchase_units": [
            {
                "amount": {
                "currency_code": "EUR",
                "value": "10.00",
                },
            },
            ],
        });
    
        const responseFinal = client.execute(newRequest);
        console.log(responseFinal)
    
        return responseFinal.result;
    })
    
});


exports.generatePDFInvoice = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {

        const workout = request.body.data
        const date = request.body.date
        const id = request.body.id
        const purchaseInfo = request.body.purchase_info
        const user = request.body.user_info
        const dataPay = user.data_pay_tax
        const location = workout.location
        const amount = purchaseInfo.amount
        const payee = purchaseInfo.payee

        console.log(request.body)
        
        const logo = './src/images/logo.png'
        var docDefinition = {
            pageSize: {
                width: 600,
                height: 960
            },
            pageOrientation:'portrait',
            content: [
                {
                    columns:[
                        
                        [
                            {
                                image: logo,
                                width: 70,
                                height: 70,
                                alignment: 'right',
                                margin: [0, 0, 0, 30],
                            },
                            {
                                text: 'Sindy Leiert, Großstraße 45, 12456 Berlin',
                                color: '#000000',
                                width: '*',
                                fontSize: 12,
                                alignment: 'left',
                                margin: [0, 15, 0, 8],
                            },
                            {
                                text: 'Danke fürs Mitmachen!',
                                color: '#FFBA00',
                                bold: true,
                                width: '*',
                                fontSize: 30,
                                alignment: 'left',
                                margin: [0, 55, 0, 0],
                            },
                            {
                                text: `${dataPay.billingAddress}`,
                                width: 10,
                                fontSize: 16,
                                margin: [0, 25, 0, 0],
                            },
                            {
                                text: `Rechnungsdatum: ${workout.date}`,
                                width: 10,
                                fontSize: 20,
                                bold: true,
                                margin: [0, 95, 0, 0],
                            },
                            {
                                text: `Rechnungsnummer: ${id}`,
                                width: 10,
                                fontSize: 20,
                                bold: true,
                                margin: [0, 5, 0, 40],
                            },
                        ]
                    ],
                },
                {
                    table: {
                        widths: ['*', '*', '*', '*', '*'],
                        headerRows: 1,
                        body:[
                            [
                                {text:'Trainin', fontSize: 14, bold: true, fillColor:'#FFBA00', alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',}, 
                                {text:'Datum', fontSize: 14, bold: true, fillColor:'#FFBA00', alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',},
                                {text:'Addresse', fontSize: 14, bold: true,fillColor:'#FFBA00', alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',}, 
                                {text:'Start', fontSize: 14, bold: true,fillColor:'#FFBA00', alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',},
                                {text:'Ende', fontSize: 14, bold: true,fillColor:'#FFBA00', alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',}
                            ],
                            [
                                {text:`${workout.name}`, fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,60]}, 
                                {text:`${workout.date}`, fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,0]},
                                {text:`${location.address}`, fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,0]}, 
                                {text:`${workout.startTime} Uhr`, fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,0]},
                                {text:`${workout.endTime} Uhr`, fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,0]},
                            ]
                        ]
                    }
                },
                {
                    table: {
                        widths: [ '*', '*', '*', '*'],
                        headerRows: 1,
                        body:[
                            [
                                {text:'', fontSize: 14, bold: true,fillColor:'#FFBA00', alignment: 'right', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',},
                                {text:'Beschreibung', fontSize: 14, bold: true,fillColor:'#FFBA00', alignment: 'right', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',}, 
                                {text:'Anzahl', fontSize: 14, bold: true,fillColor:'#FFBA00',  alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',},
                                {text:'Kosten', fontSize: 14, bold: true,fillColor:'#FFBA00',  alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#FFFFFF',}
                            ],
                            [
                                {text:'', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]}, 
                                {text:`${workout.name}`, fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]}, 
                                {text:'1', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]},
                                {text:`${amount.value}€`, fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]},
                            ]
                        ]
                    }
                },
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 515, y1: 5,
                            x2: 105, y2: 5,
                            lineWidth: 1.2,
                            lineColor:'#FFBA00'
                        },
                    ]
                },
                {
                    table: {
                        widths: [ '*', '*', '*', '*'],
                        headerRows: 1,
                        body:[
                            [
                                {text:'', fontSize: 14, bold: true, alignment: 'right', border: [false, false, false, false], margin:[8,8,8,8], color: '#000',},
                                {text:'Total', fontSize: 14, bold: true, alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#000',}, 
                                {text:'', fontSize: 14, bold: true, alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#000',},
                                {text:`${amount.value}€`, fontSize: 14, bold: true, alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#000',}
                            ],
                            [
                                {text:'', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]}, 
                                {text:'', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]}, 
                                {text:'', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]},
                                {text:'', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]},
                            ]
                        ]
                    }
                },
                {
                    columns:[
                        [
                            {
                                text: `Payed via Paypal ${dayjs(date).format('HH:mm:ss')}, ${payee.email_address}`,
                                color: '#000000',
                                width: '*',
                                fontSize: 10,
                                alignment: 'left',
                                margin: [0, 50, 0, 5],
                            },
                        ]
                    ]
                }
            ]
        }
        const options = {
            version: 'v2', // defaults to 'v2' if missing.
            action: 'resumable',
            expires: Date.now() + 1000 * 60 * 60, // one hour
        }
        const pdfName= `${id}${workout.workout}.pdf`;
        const fileName = 'Invoices/'+pdfName;
        const storage = new Storage({projectId: 'lulada-a38cb' });
        const filePDF = storage.bucket(BUCKET).file(fileName)
        var printer = new PdfPrinter(fonts);
        var pdfDoc = printer.createPdfKitDocument(docDefinition);
        pdfDoc.pipe(filePDF.createWriteStream())
        pdfDoc.end();
        console.log(filePDF, 'URLllllllllll')
        return pdfName
    })
})

exports.cancelWorkout = functions.https.onRequest((request, response) => {
    corsHandler(request, response, () => {

        const workoutData = {
            workout_schedule: request.body.workout_schedule
        }

        admin.firestore().collection('Payments')
        .where("workout_schedule", "==", workoutData.workout_schedule)
        .get()
        .then((querySnapshot) => {
            const workouts = []
            querySnapshot.forEach((doc) => {
                workouts.push({
                    id:doc.id,
                    ...doc.data()
                })
            })
            if(workouts.length < 3){
                response.send({
                    title:'No hay suficientes participantes'
                })
            } else {
                response.send({
                    title:'Listo para empezar'
                })
            }
        }).catch((error) => {
            response.send({
                title:error
            })
            console.log(error)
        })
    })
})

exports.notificationsInstructor = require('./src/notifications/instructor')
//exports.workouts = require('./src/workouts/index')
