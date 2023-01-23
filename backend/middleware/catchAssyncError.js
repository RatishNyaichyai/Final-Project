module.exports = Funct => (req, res, next) => {
    Promise.resolve(Funct(req, res, next)).catch(
        next
    )
}