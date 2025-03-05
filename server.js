const express = require('express');
const axios = require('axios');
const redis = require('redis');
require('dotenv').config();

let redisclient;
const Port  = process.env.PORT;

const app = express();

 
(async ()=>{
    redisclient = redis.createClient();

    redisclient.on("err",(error)=>console.log(`err : ${error}`))

    await redisclient.connect()
})()

app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}))

app.get('/weather/:city',async (req,res)=>{
    const city = req.params.city;
    let isCached = false;
    let results;
    try{
        const cacheWeather = await redisclient.get(city)
         
        if(cacheWeather){
            isCached=true;
            results = JSON.parse(cacheWeather);
            
        }else{
            
            const weatherResult = await axios.get(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=metric&key=QCNKKF2FJLAF4BVEQAYZPPLV7&contentType=json`)
            results = weatherResult.data;

            if(results.length===0){
                throw 'API empty array'
            }
            await redisclient.set(city,JSON.stringify(results),{
                EX:10,
                NX:true,
            })
        }
    
    res.render('index',{isCached,results})
  
    }catch(err){
        console.log(err);
        res.status(404).send('data unavailable')
    }

})
app.post('/weather/post',(req,res)=>{
    const city = req.body.cities; 
    res.redirect(`/weather/${city}`)
})

app.listen(Port,()=>{
    console.log(`listen to the port ${Port}`)
})

