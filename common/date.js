/**
 * Format Date to YY.MM.DD
 *
 * @param {Date} date Date
 * @returns 
 */
function format(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    return [month, day, year].join('.');
}

export default { format };
