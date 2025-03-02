const express = require('express');
const axios = require('axios');
const redis = require('redis');

require('dotenv').config();

let redisclient;

(async ()=>{
    redisclient = redis.createClient();

    redisclient.on("err",(error)=>console.log(`err : ${error}`))

    await redisclient.connect()
})()
const Port  = process.env.PORT;

const app = express();

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
            results = await axios.get(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=metric&key=QCNKKF2FJLAF4BVEQAYZPPLV7&contentType=json`)
            console.log(results.data)
            if(results.length===0){
                throw 'API empty array'
            }
            await redisclient.set(city,JSON.stringify(results.data),{
                EX:180,
                NX:true,
            })
        }
    res.send({
        isChace: isCached,
        data: results
    })
  
    }catch(err){
        console.log(err);
        res.status(404).send('data unavailable')
    }

})

app.listen(Port,()=>{
    console.log(`listen to the port ${Port}`)
})

