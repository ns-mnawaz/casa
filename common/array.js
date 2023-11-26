
/**
 * find uniq from array
 *
 * @param {Array<string>} keys object keys
 * @returns 
 */
Array.prototype.uniq = function(keys) {
    return this.filter(
        (valueSet => item =>
            (value =>  !valueSet.has(value) && valueSet.add(value))
            (keys.map(key => typeof item === 'object' && item[key]).join('|'))
        )
        (new Set)
    );
};
/**
 * find difference between 2 arrays on keys
 *
 * @param {Array<object>} a array of objects
 * @param {Array<string>} keys objects keys 
 * @returns 
 */
Array.prototype.diff = function(a, keys) {
    function compare(left, right) {
        let condition = 0;
        keys.forEach(key => {
            if(left && right && typeof left[key] !== 'undefined' && right[key] !== 'undefined' && left[key] === right[key]) {
                condition++;
            }
        });
        return condition === keys.length && condition > 0;
    }
    return this.filter(leftValue =>
        !a.some(rightValue => compare(leftValue, rightValue, keys))
    );
}
