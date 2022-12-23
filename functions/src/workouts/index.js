const functions = require("firebase-functions");
const admin = require("firebase-admin");
const dayjs = require("dayjs");
const {Storage} = require('@google-cloud/storage');
const BUCKET = 'lulada-a38cb.appspot.com'
const PdfPrinter = require('pdfmake')
const font = require('pdfmake/build/vfs_fonts.js')
const cors = require("cors");
const corsHandler = cors({ origin: true });

var fonts = {
	Roboto: {
        normal: Buffer.from(font.pdfMake.vfs['Roboto-Regular.ttf'], 'base64'),
        bold: Buffer.from(font.pdfMake.vfs['Roboto-Medium.ttf'], 'base64'),
        italics: Buffer.from(font.pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
        bolditalics: Buffer.from(font.pdfMake.vfs['Roboto-Italic.ttf'], 'base64'),
	}
};

exports.generatePDFInvoice = functions.https.onRequest((request, response) => {
    corsHandler(request, response, () => {
        var doc = {
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
                                text: 'Sindy Leiert, Großstraße 45, 12456 Berlin',
                                color: '#000000',
                                width: '*',
                                fontSize: 12,
                                alignment: 'left',
                                margin: [0, 0, 0, 10],
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
                                text: 'Tanveer Singh',
                                width: 10,
                                fontSize: 16,
                                margin: [0, 25, 0, 0],
                            },
                            {
                                text: 'Leienstraße 67',
                                width: 10,
                                fontSize: 16,
                                margin: [0, 5, 0, 0],
                            },
                            {
                                text: '12358 Berlin',
                                width: 10,
                                fontSize: 16,
                                margin: [0, 5, 0, 0],
                            },
                            {
                                text: 'Rechnungsdatum: 04.08.2022',
                                width: 10,
                                fontSize: 20,
                                bold: true,
                                margin: [0, 95, 0, 0],
                            },
                            {
                                text: 'Rechnungsnummer: 23986948590',
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
                                {text:'ddd', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,60]}, 
                                {text:'ddd', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,0]},
                                {text:'ddd', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,0]}, 
                                {text:'ddd', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,0]},
                                {text:'ddd', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,0]},
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
                                {text:'ddd', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]}, 
                                {text:'ddd', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]},
                                {text:'ddd', fontSize: 12, alignment: 'center', border: [false, false, false, false], margin:[0,10,0,10]},
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
                                {text:'Kosten', fontSize: 14, bold: true, alignment: 'center', border: [false, false, false, false], margin:[8,8,8,8], color: '#000',}
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
                                text: 'Payed via Paypal 01:56PM Jessica@cool.com',
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
        const pdfName= 'Factura.pdf';
        const fileName = 'Invoices/'+pdfName;
        const storage = new Storage({projectId: 'lulada-a38cb' });
        const filePDF = storage.bucket(BUCKET).file(fileName);
        var printer = new PdfPrinter(fonts);
        var pdfDoc = printer.createPdfKitDocument(doc);
        pdfDoc.pipe(filePDF.createWriteStream())
        pdfDoc.end();
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
/**exports.captureWorkoutsForToday = functions.pubsub.schedule('every 1 minutes').onRun((context) => {

    console.log('Funcionando 1 minute')
    const today = dayjs(new Date()).format('YYYY-MM-DD')

    admin.firestore().collection('Workouts_Schedule') // Get workouts today
    .where("date", "==", today)
    .get()
    .then((querySnapshot) => {
        const workouts = []
        querySnapshot.forEach((doc) => {
            workouts.push({
                id:doc.id,
                ...doc.data()
            })
        })
        scheduleWorkouts(workouts)
    }).catch((error) => {
        console.log(error)
    })
});

const scheduleWorkouts = (workouts) => {
    workouts.forEach((workout, index) => {
        const date = workout.date
        const start_time = dayjs(`${date} ${workout.startTime}`).format('YYYY-MM-DD HH:mm')
        const month = dayjs(date).get('month') + 1
        const day = dayjs(start_time).get('date')
        const hour = dayjs(start_time).get('hour') 
        const minutes = dayjs(start_time).get('minute')
        console.log(`fecha`, start_time)
        console.log({'minutos':minutes, 'horas':hour, 'dia':day, 'mes':month})
        scheduleWorkoutToCancel(`${55} ${16} ${day} ${month} *`)
    })
}

const scheduleWorkoutToCancel = functions.pubsub.schedule(date).onRun((context) => {
        console.log(date, context)
        console.log('se ejecuto correctamente', date)
})


exports.proofWorkout = functions.runWith({
    timeoutSeconds: 300,
    memory: "1GB",
}).tasks.taskQueue({
    retryConfig: {
    maxAttempts: 5,
    minBackoffSeconds: 60,
    },
    rateLimits: {
    maxConcurrentDispatches: 6,
    },
}).onDispatch(async (data) => {
    console.log(data, 'data')
    console.log('data se ejecutó')
})

exports.proofWorkoutTasks = functions.https.onRequest(
    async (_request, response) => {
        const d = get 
        //const queue = getFunctions().taskQueue("proofWorkout");
        const enqueues = [];
        for (let i = 0; i <= 10; i += 1) {
            // Enqueue each task with i*60 seconds day. Our task queue function
            // should process ~1 task/min.
            const scheduleDelaySeconds = i * 60 
            enqueues.push(
                queue.enqueue(
                { id: `task-${i}` },
                {
                    scheduleDelaySeconds,
                    dispatchDeadlineSeconds: 60 * 5 // 5 minutes
                },
                ),
            );
        }
        await Promise.all(enqueues);
        response.sendStatus(200);    
    }
);**/