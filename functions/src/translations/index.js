const de = require('./de')
const en = require('./en')

exports.identifyLanguage = (language) => {
    return language == 'en' ? en : de
}