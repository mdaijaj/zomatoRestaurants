module.exports = (register) => {
    
    register.get('/', (req, res) => {
        res.sendFile(__dirname + '/views/register.html')
    })
}
