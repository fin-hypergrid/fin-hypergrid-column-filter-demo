'use strict';

var firstNames = ['', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Boy', 'Liam', 'Noah', 'Ethan', 'Mason', 'Logan', 'Moe', 'Larry', 'Curly', 'Shemp', 'Groucho', 'Harpo', 'Chico', 'Zeppo', 'Stanley', 'Hardy'],
    
    lastNames = ['', 'Wirts', 'Oneil', 'Smith', 'Barbarosa', 'Soprano', 'Gotti', 'Columbo', 'Luciano', 'Doerre', 'DePena'],
    
    months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    
    days = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    
    states = ['', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];

function randomPerson() {
    var firstName = Math.round((firstNames.length - 1) * Math.random()),
        lastName = Math.round((lastNames.length - 1) * Math.random()),
        number_of_pets = Math.round(10 * Math.random()),
        birthyear = 1900 + Math.round(Math.random() * 114),
        birthmonth = Math.round(Math.random() * 11),
        birthday = Math.round(Math.random() * 29),
        birthstate = Math.round(Math.random() * (states.length - 1)),
        residencestate = Math.round(Math.random() * (states.length - 1)),
        travel = Math.random() * 1000,
        income = 50000 + Math.random() * 10000,
        employed = Math.round(Math.random());
    
    return {
        last_name: lastNames[lastName], //jshint ignore:line
        first_name: firstNames[firstName], //jshint ignore:line
        number_of_pets: number_of_pets,
        birthDate: birthyear + '-' + months[birthmonth] + '-' + days[birthday],
        birthState: states[birthstate],
        residenceState: states[residencestate],
        employed: employed === 1,
        income: income,
        travel: travel
    };
}

module.exports = function(numRows) {
    numRows = numRows || 10000;

    for (var i = 0, data = Array(numRows); i < numRows; i++) {
        data[i] = randomPerson();
    }
    
    return data;
};
