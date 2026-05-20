/* return random integer from 0 to upperBound - 1
 */
export const getRandomNumber = (upperBound: number): number => {
    return Math.floor(Math.random() * upperBound);
};
