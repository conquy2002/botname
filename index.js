const colors = require('colors');
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const puppeteer = require("puppeteer");
const login = require("fca-unofficial");
var log = require("npmlog");
const { execSync } = require('child_process');
log.pause()


global.client = new Object({
    botID: 0,
    reaction: [],
    messages: [],
    reply: [],
    await: false,
    cooldowns: [],
    admin: false,
    eventlog: {},
    wait: false,
})

var hệthống = {
    các_dữ_liệu_cần: ["người_dùng","nhóm","khác"],
    api: null,
    loading: null,
    startload: false,
    browser: false,
    api: null,
    listen: null,
    pagefb: null,
    errPlugin: [],
    cn: 0,
    kt: false,
    lặp: false,
    kiếmtra:  function(){
        //kiếm tra cấu hình
        var cấu_hình_mặc_định = {
            tên_bot: "Robinbot",
            tiền_tố: "&",
            hiện_thị_sự_kiện: false,
            chỉ_cho_quản_trị_viên_nhóm_dùng: false,
            quản_trị_viên: [],
            cấm_lệnh: [],
            cấm_người_dùng: [],
            cấm_nhóm: [],
            userAgent: false
        }
        try{
            if(!fs.existsSync(path.join(process.cwd(), "./cấu_hình.json"))){
                global.cấu_hình  = cấu_hình_mặc_định;
                global.môhình.lưu_tệp_tin("cấu_hình.json",cấu_hình_mặc_định);
            }else{
                global.cấu_hình  = JSON.parse(fs.readFileSync(path.join(process.cwd(), "./cấu_hình.json"), { encoding: "utf8" }));
                //kiếm tra thiếu sót
                for (let configName in cấu_hình_mặc_định) {
                  if (!Object.prototype.hasOwnProperty.call(global.cấu_hình, configName)) {
                    global.cấu_hình[configName] = cấu_hình_mặc_định[configName];
                  }
                }
                global.môhình.lưu_tệp_tin("cấu_hình.json",global.cấu_hình);
            }       
        }catch(ex){
            global.cấu_hình  = cấu_hình_mặc_định;
            global.môhình.lưu_tệp_tin("cấu_hình.json",cấu_hình_mặc_định)
        }
        global.môhình.hiểnthị("Cấu hình","hệ thống")
        
        //kiếm tra trong data
        //kiếm tra và tạo thư mực database
        !fs.existsSync(path.join(process.cwd(), `./cơ sở dữ liệu`)) ? global.môhình.tạo_thư_mục("cơ sở dữ liệu") : "";
        //kiếm tra và tạo thư mục lưu chữ phương tiện
        !fs.existsSync(path.join(process.cwd(), `./cơ sở dữ liệu/src`)) ? global.môhình.tạo_thư_mục("src","cơ sở dữ liệu") : "";
        !fs.existsSync(path.join(process.cwd(), `./cơ sở dữ liệu/src/lỗi lấy thông tin`)) ? global.môhình.tạo_thư_mục("lỗi lấy thông tin","cơ sở dữ liệu/src") : "";
        //kiếm tra nơi lưu dữ liệu
        for(var file of this.các_dữ_liệu_cần){
            !fs.existsSync(path.join(process.cwd(), `./cơ sở dữ liệu/${file}.json`)) ? 
                global.môhình.lưu_tệp_tin(`${file}.json`,{},"cơ sở dữ liệu") : "";
        }
        //đưa dữ liệu vào global\
        global.data = {}
        const datas = fs.readdirSync(path.join(process.cwd(), `./cơ sở dữ liệu`)).filter((file) => file.endsWith(".json"));
        for (const data of datas){
            var d = data.replace(`.json`,``);
            if(d.endsWith("-err")) {global.môhình.hiểnthị(` Phát hiện 1 thư mục lỗi`,d,1) ;continue}
            try{
                global.data[d] = JSON.parse(fs.readFileSync(path.join(process.cwd(), `./cơ sở dữ liệu/${data}`), { encoding: "utf8" }));
            }catch(ex){
                global.môhình.hiểnthị(`Lỗi: `+ ex,d,1);
                fs.renameSync(path.join(process.cwd(), `./cơ sở dữ liệu/${data}`),path.join(process.cwd(), `./cơ sở dữ liệu/${d}-err.json`));
                global.môhình.hiểnthị(`Đổi tên file lỗi`,`${d}-${ex}-err`,4);
                global.môhình.lưu_tệp_tin(data,{},"data");
                global.môhình.hiểnthị(`Tạo thành công thư muc ảo`,d,4)
                global.data[d] = {}
            }
        }

        global.data.người_dùng.giới_tính ? " " : global.data.người_dùng.giới_tính = {};
        global.data.người_dùng.chờ_duyệt ? " " : global.data.người_dùng.chờ_duyệt = [];
        global.data.người_dùng.thông_tin ? " " : global.data.người_dùng.thông_tin = {};
        global.data.người_dùng.lỗi_chưa_biết ? " " : global.data.người_dùng.lỗi_chưa_biết = [];

        global.môhình.hiểnthị("Cơ sở dữ liêu","hệ thống")

        //kiếm tra fbstate
        if(!fs.existsSync(path.join(process.cwd(), `./fbstate.json`))){
            global.môhình.hiểnthị("Không tìm thấy fbstate.json","hệ thống",0);
            hệthống.load("stop")
            process.exit(0)
        }else{
            global.môhình.hiểnthị("Tìm thấy fbstate.json","hệ thống")
        }
        var cookie = require("./fbstate.json");
        var cookies = [];
        cookie.forEach(a => {
            cookies.push({
                "name" : a.key,
                "value" : a.value,
                "domain": "." + a.domain,
                "path": a.path,
                "httpOnly": a.hostOnly,
                "sameSite": "None",
                "secure": true,
                "sameParty": false,
                "sourceScheme": "Secure",
                "sourcePort": 443
            })
        })
        this.cookies = cookies;
        this.cookie = cookie
        //để lấy một số dữ kiện j j đó
        this.tạoweb()
        
        //kiếm tra userAgent
        async function getUserAgent(){
            try{
                var page = await global.browser.newPage()
                await page.goto("https://www.whatsmyua.info/",{ waitUntil: ['networkidle2'] })
                var dataend = await page.evaluate(() => {
                    return document.getElementById("custom-ua-string").value
                })
                return dataend
            }catch(err){
                return err
            }   
        }
        if(!global.cấu_hình.userAgent){
            getUserAgent().then(data => {
                global.môhình.hiểnthị(data,"userAgent",3)
                global.cấu_hình.userAgent = data
                global.môhình.lưu_tệp_tin("cấu_hình.json",global.cấu_hình)
            }).catch(err => global.môhình.hiểnthị("Không thể lấy userAgent","hệ thống",0))
        }else{
            global.môhình.hiểnthị(global.cấu_hình.userAgent,"userAgent",3)
        }
        //kiếm tra các lệnh
        global.plugin = {};
        var error = 0;
        //lấy các lệnh
        const pluginFiles = fs.readdirSync(path.join(process.cwd(), `/các lệnh`)).filter((file) => file.endsWith(".js"));
        for (const file of pluginFiles) {
            try {
                //truy cập vào các lệnh
                const plugin = require(path.join(process.cwd(), `/các lệnh/${file}`))();
                if(!plugin.info) throw new Error("Thiếu info");
                const pluginName = plugin.info.name;
                plugin.file = file;
                if(global.plugin[pluginName]) throw new Error(file + " có tên trùng với "+ global.plugin[pluginName].file);
                if (plugin.info.modules) {
                    try {
                        for (const i of plugin.info.modules) require.resolve(i);
                    }
                    catch (e) {
                        execSync('npm i -s ' + plugin.info.modules.join(" "));
                        delete require.cache[require.resolve(`./các lệnh/${file}`)];
                    }
                }
                //dưa lệnh vào global
                if(!global.cấu_hình.cấm_lệnh.includes(pluginName)){
                    global.plugin[pluginName] = plugin;
                } 
            }
            catch (err) {
                error++
                global.môhình.hiểnthị(`Đã có lỗi xảy ra khi tải file "${file}"`, "plugin",0);
                hệthống.errPlugin.push({
                    file: process.cwd() + `/các lệnh/${file}`,
                    err: err
                })
            }
        }
        global.môhình.hiểnthị(`Hoàn thành với: `+Object.keys(global.plugin).length+ " lệnh" ,"plugin",1);
        global.môhình.hiểnthị(`Lệnh lỗi: `+ error ,"plugin",2);
        //kiếm tra các sự kiện
        global.event = {};
        const eventFiles = fs.readdirSync(path.join(process.cwd(), `/các sự kiện`)).filter((file) => file.endsWith(".js"));
        for (const file of eventFiles) {
            try {
                const event = require(path.join(process.cwd(), `/các sự kiện/${file}`))();
                const eventName = event.info.name;
                if(global.event[eventName]) throw new Error("Bị trùng");
                    global.event[eventName] = event;
            }
            catch (err) {
                 global.môhình.hiểnthị(`Đã có lỗi xảy ra khi tải file "${file}"`,"event",0);
                 hệthống.errPlugin.push({
                    file: process.cwd() + `/các lệnh/${file}`,
                    err: err
                })
            }
        }
        this.kt = true 

    },
    môhình:{
        lưu_tệp_tin: (tên_tệp_tin,dữ_liệu,nơi_lưu) =>{
            if(nơi_lưu == null) nơi_lưu=`./`
                else nơi_lưu = `./${nơi_lưu}/`;
            fs.writeFileSync(path.join(__dirname, `${nơi_lưu}${tên_tệp_tin}`), JSON.stringify(dữ_liệu, null, 4), {
                mode: 0o666
            });
        },
        tạo_thư_mục: (tên_thư_mục,nơi_lưu) =>{
            if(nơi_lưu == null) nơi_lưu=`./`
                else nơi_lưu = `./${nơi_lưu}/`;
            fs.mkdirSync(path.join(process.cwd(), `./${nơi_lưu}${tên_thư_mục}`),{mode: 0o777,recursive: true})
        },
        hiểnthị: (data, option, more) =>{
            if(!this.startload) hệthống.load("pause")
            // hệthống.load("stop")
            const color = more == 0 ? "brightRed" : more == 1 ? "yellow" : more == 2 ? "brightCyan" : more == 3 ? "brightMagenta" : "brightGreen";
            if (option == 0) return console.log(data.yellow);
            else if (option == undefined) return console.log(`  [ ${(data.toUpperCase()).green} ] » ` + data);
            else return console.log(`  [ ${option.toString().toUpperCase()[color]} ] ${"►►".random} ` + `${data}`);
        },
        compare: function (main, array) {
            var compare = [], i = 0;
            for (let j = 0; j < array.length; j++) {
                var e = 0, map = [], string = array[j];
                for (let k = 0; k < main.length - 1; k++) {
                    const key = main.substring(k, k + 2);
                    const value = map.some(item => item.key == key) ? map.find(item => item.key == key).value + 1 : 1;
                    map.indexOf(map.find(item => item.key == key)) > -1 ? map[map.indexOf(map.find(item => item.key == key))] = { key, value } : map.push({ key, value });
                }
                ;
                for (let k = 0; k < string.length - 1; k++) {
                    const key = string.substring(k, k + 2);
                    const value = map.some(item => item.key == key) ? map.find(item => item.key == key).value : 0;
                    if (value > 0) {
                        map.indexOf(map.find(item => item.key == key)) > -1 ? map[map.indexOf(map.find(item => item.key == key))] = { key, value } : map.push({ key, value });
                        e++;
                    }
                }
                var rating = (2.0 * e) / (main.length + string.length - 2);
                compare.push({ string, rating });
                if (rating > compare[i].rating)
                    i = j;
            }
            return compare[i].rating >= 0.6 ? compare[i].string : 'none';
        }
    },
    load: function(option){
        if(option == "load"){
            let i = 0;
            let chấm = ["."];
            const frames = [
                "-",
                "\\",
                "|",
                "/",
            ];
            this.loading = setInterval(() => {
                i = ++i % frames.length
                const frame = frames[i];
                chấm.push(".")
                if(i == 0) chấm = ["."]
                readline.clearLine(process.stdout, 1);
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`  [ ${frame.random} ] Đang kiếm tra các cài đặt  ${chấm.join("").random}`);
            }, 150);
        }else if(option == "pause"){
            clearInterval(this.loading);
            readline.clearLine(process.stdout, 1);
            readline.cursorTo(process.stdout, 0);
            if(!this.startload) this.load("load")
        }else{
            clearInterval(this.loading);
            readline.clearLine(process.stdout, 1);
            readline.cursorTo(process.stdout, 0);
            this.startload = true;
        }
    },
    đăngnhập: function() {
        login({ appState: hệthống.cookie }, function (error, api) {
            if (error) {
                global.môhình.hiểnthị('Không thể khởi tạo chương trình.', 'bot',0);
                global.môhình.hiểnthị(`Đăng nhập thất bại: ${JSON.stringify(error)}`,"login",0);
                console.log(error)
                return process.exit(0);
            }
            api.setOptions({
                listenEvents: true,
                selfListen: true,
                updatePresence: false,
                autoMarkRead: false,
                autoMarkDelivery: false,
                forceLogin: false,
                userAgent: global.cấu_hình.userAgent
            })
            //hiện thị ở cmd
            global.client.botID = api.getCurrentUserID();
            global.môhình.hiểnthị("Bot ID: " + global.client.botID , "bot");
            global.môhình.hiểnthị("tiền_tố: "+ global.cấu_hình.tiền_tố, "bot");
            global.môhình.hiểnthị("botName: " + global.cấu_hình.tên_bot , "bot");
            global.môhình.hiểnthị("Bắt đầu nhận tin.", "bot");
            
            if(hệthống.errPlugin.length != 0){
                console.log("  ======================== CÁC LỖI =======================".rainbow)
                for(let err of hệthống.errPlugin){
                    console.log(err)
                }
                console.log("  ========================================================".rainbow)
            }
            hệthống.load("stop")
            hệthống.api = api
            hệthống.lắngnghe()
            hệthống.lặp = true;
        });
    },
    tạoweb: async function(){
        try{
            global.browser = await puppeteer.launch(args=['--no-sandbox']);
            global.môhình.hiểnthị("Tạo trình duyệt thành công","hệ thông")
            this.browser = true;
        }catch(err){
            global.môhình.hiểnthị("Lỗi tạo trình duyệt","hệ thông",1)
            console.log(err)
            global.môhình.hiểnthị("Đang khởi tạo lại trình duyệt","hệ thông",3)
            this.tạoweb();
        }
    },
    lắngnghe: function(){
        hệthống.listen = hệthống.api.listenMqtt(function nghe_bot_nói_gì(error, event) {
            try{
                if(error) global.môhình.hiểnthị(JSON.stringify(error),"listen",0);
                if (typeof event != "undefined" && event != null) {
                    switch (event.type) {
                        case "read":
                        case "read_receipt":
                        case "presence":
                        case "typ":
                          return;
                    }
                    //hiện thị ở cmd
                    if(global.cấu_hình.hiện_thị_sự_kiện || global.client.eventlog[event.threadID]) console.log(event);
                    //bắt các sự kiện
                    switch (event.type) {
                        case 'message':
                        case 'message_reply': {
                            //lấy các value trong event
                            let { type, body, mentions, attachments, senderID, threadID, messageID, messageReply, timestamp , isGroup } = event;
                            let command, args, contentMsg;
                            //lấy các tin nhắn để resend
                            global.client.messages.push(event);
                            //kiếm tra lệnh
                            if (body.indexOf(global.cấu_hình.tiền_tố) == 0) {
                                command = body.slice(global.cấu_hình.tiền_tố.length, body.length).split(' ')[0];
                                args = body.slice(global.cấu_hình.tiền_tố.length, body.length).split(' ').slice(1);
                                contentMsg = body.slice(global.cấu_hình.tiền_tố.length + command.length + 1, body.length);
                                if (command.includes('\n')) {
                                    args = [command.slice(command.indexOf('\n') + 1, command.length), ...args];
                                    command = command.slice(0, command.indexOf('\n'));
                                }
                                let getCorrect = global.môhình.compare(command, Object.keys(global.plugin));
                                if (getCorrect != 'none')
                                    command = getCorrect;
                            }
                            else
                                contentMsg = body;
                            //thêm các giá trị cho event để dễ
                            let formattedEvent = {
                                command,
                                args,
                                contentMsg
                            };
                            Object.assign(event, formattedEvent);
                            if(body == "test") hệthống.api.sendMessage("Đây là Herosky2",threadID)
                            //kiểm tra dữ liệu
                            hệthống.kiếmtradữliệu(threadID,isGroup);
                            hệthống.kiếmtradữliệu(senderID);
                            //người dùng lệnh
                            hệthống.nghelệnh(event);
                            break;
                        }
                        // case "message_reaction": handleReaction({api})(event)
                        // case 'event': subscription_1.default({ api, botData })(event);
                    }
                }

            }catch(ex){
                console.log(ex)
            }
        })
    },
    nghelệnh: function(event) {
        try{
            var api = this.api;
            let {  threadID, messageID, senderID , command , isGroup} = event;

            //cấm người dùng sử dụng bot
            if(global.cấu_hình.cấm_người_dùng.some(user => user.id == senderID)){
                var userban =  global.cấu_hình.cấm_người_dùng.find(user => user.id == senderID)
                return api.sendMessage(`Bạn bị cấm: \nLý do: ${userban.reason} \nTime: ${userban.time}`,threadID, async (err, info) => {
                    try{
                        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
                        api.unsendMessage(info.messageID);
                    }catch(err){
                        console.log(err)
                    }
                },messageID)        
            }

            for(let plugin in global.plugin){
                if(typeof global.plugin[plugin].noPrefix == "function"){
                    try{
                        global.plugin[plugin].noPrefix({ event, api });
                    }catch(ex){
                        console.log(ex);
                    }
                }
            }
            global.data.khác.cấm_lệnh ? " " : global.data.khác.cấm_lệnh = {};
            if(global.plugin[command]){
                if(isGroup)
                    if(global.data.khác.cấm_lệnh[threadID])
                        if(getThread.blockCmd.some(cmd => cmd == command))
                            return api.sendMessage('Lệnh này đã bị cấm.', threadID, messageID);
                if(global.data.khác.cấm_lệnh[senderID])
                    if(global.data.khác.cấm_lệnh[senderID].some(cmd => cmd == command))
                        return api.sendMessage('Bạn đã bị cấm dùng lệnh này.', threadID, messageID);
                let cmd = global.plugin[command];
                try{
                    if(cmd.info.admin)
                        try{
                            return global.cấu_hình.quản_trị_viên.includes(senderID) ? 
                                cmd.run({ event, api}) 
                                : api.sendMessage('Chỉ admin mới được dùng.', threadID, messageID);
                        }catch(err){
                            console.log(err);
                            api.sendMessage(err, threadID, messageID)
                        }
                    try{
                        return cmd.run({ event, api})
                    }catch(err){
                            console.log(err);
                            api.sendMessage(err, threadID, messageID)
                        }   
                     
                }catch(ex){
                    return api.sendMessage(`Lỗi lệnh: ${command}: \n${ex}`, threadID, messageID);
                }
            }
        }catch(err){
            console.log(err)
        }
    },
    kiếmtradữliệu:  function(id,là_box) {
        //cho id vào danh sách duyệt
         //xem có trong thông tin không
        if (!global.data.người_dùng.thông_tin[id]) {
            //xem có trong chờ duyệt không
            if(!global.data.người_dùng.chờ_duyệt.some(i => i == id)){
                //xem có trong lỗi không
                if(!global.data.người_dùng.lỗi_chưa_biết.some(i => i == id)) 
                    //xem có phải là nhóm không
                    if(!global.data.nhóm[id])
                        global.data.người_dùng.chờ_duyệt.push(id)
            }
        }
        //kiếm tra trong box
        if (!global.data.nhóm[id] && là_box && !global.client.wait) {
            global.client.wait = true;
            this.api.getThreadInfo(id,(err,info)=>{
                if(err){
                    global.môhình.hiểnthị("không thể lấy thông tin nhóm","api",0)
                    console.log(err)
                    return global.client.wait = false
                }
                //khởi tạo 
                global.data.nhóm[id] = {
                    name: info.name,
                    chao:"",
                    avtchao: "",
                    onlyqtv: false,
                    blockCmd: [], 
                    shortcut: [] ,
                    blockMem: [],
                    rules: [],  
                    logo: "",
                    autosetName: false,
                    mems:{}
                };
                let ids = info.participantIDs;
                ids.forEach(v => {
                    global.data.nhóm[id].mems[v] = {}
                    global.data.nhóm[id].mems[v].countchat = 0;
                    global.data.nhóm[id].mems[v].warn = [];
                });
                //lấy giới tính
                for(let z in info.userInfo){
                    var userData = info.userInfo[z];
                    let sex = userData.gender;
                    global.data.người_dùng.giới_tính[userData.id] = sex == "FEMALE" ? `Nữ` : sex == "MALE" ? "Nam" : "Phi giới tính"
                    //xem có trong thông tin không
                    if (!global.data.người_dùng.thông_tin[userData.id]) {
                        //xem có trong chờ duyệt không
                        if(!global.data.người_dùng.chờ_duyệt.some(i => i == userData.id)){
                            //xem có trong lỗi không
                            if(!global.data.người_dùng.lỗi_chưa_biết.some(i => i == userData.id)) 
                                //xem có phải là nhóm không
                                if(!global.data.nhóm[userData.id])
                                    global.data.người_dùng.chờ_duyệt.push(userData.id)
                        }
                    }
                }
                global.môhình.lưu_tệp_tin("nhóm.json",global.data.nhóm,"cơ sở dữ liệu");
                global.môhình.hiểnthị(`Nhóm mới: ${id} || ${info.name}`,`cơ sở dữ liệu`,2);
                return global.client.wait = false;
            })
        }
       
    },
    lấythôngtinngườidùng:  function(id,callback){
        async function getUserInfo(id) {
            try{
                hệthống.pagefb = await browser.newPage();
                hệthống.pagefb.setViewport({ width: 1920, height: 1080 })
                await hệthống.pagefb.setCookie(...hệthống.cookies);
                await hệthống.pagefb.goto("https://www.facebook.com/" +id ,{ waitUntil: ['networkidle2'] })
                var dataend = await hệthống.pagefb.evaluate( () => {
                    var info = {}
                    if(document.querySelectorAll('.bi6gxh9e > span > h1')[0]){
                        var fullname = document.querySelectorAll('.bi6gxh9e > span > h1')[0].innerText;
                        var name;
                        if(fullname.indexOf("(") != -1) {
                            var index = fullname.indexOf("(");
                            name = fullname.slice(0, index).trim();
                        }else{
                            name = fullname.trim()
                        }
                        var alldiv = Object.values(document.getElementsByTagName('div'));
                        var find = 0;
                        alldiv.forEach( a => {
                            if(a.getAttribute('data-pagelet')){
                                if(a.getAttribute('data-pagelet') == "ProfileTilesFeed_0") {
                                    var divtieusu = a.querySelector(".sjgh65i0 .sej5wr8e > div .rq0escxv > div > span")
                                    info.tsu = divtieusu ? divtieusu.innerText : "ẩn" ;
                                    var b = a.querySelectorAll('.sjgh65i0 .sej5wr8e > div > div > ul > div')
                                    b.forEach(c => {
                                        if(c.querySelector('div > div > div > span')){
                                            var data = c.querySelector('div > div > div > span').innerText;
                                            if(data.indexOf("Có") != -1 && data.indexOf("người theo dõi") != -1){
                                                info.flw = data
                                            }else if(!info.flw){
                                                info.flw = "ẩn"
                                            }
                                            var relationship = ['Độc thân', 'Hẹn hò', 'Đã đính hôn', 'Đã kết hôn', 'Chung sống có đăng ký', 'Chung sống', 'Tìm hiểu', 'Có mối quan hệ phức tạp', 'Đã ly thân', 'Đã ly hôn', 'Góa','hẹn hò']
                                            relationship.forEach(re => {
                                                if(data.indexOf(re) != -1){
                                                    info.tthai = data
                                                }
                                            })
                                        }
                                    })
                                }else if(a.getAttribute('data-pagelet') == "ProfileTilesFeed_{n}"){
                                    var b = a.querySelectorAll('.sjgh65i0 > div > div .aodizinl > div > div > div > div')
                                    if(b[1]){
                                        var c = b[1].querySelector('span').innerText;
                                        if(c.indexOf("người") !=-1 ){
                                            if(c.indexOf("(") != -1) {
                                                var index = c.indexOf("(");
                                                info.bb = c.slice(0, index);
                                            }else if(c.indexOf("bạn chung") == -1){
                                                info.bb = c
                                            }else{
                                                info.bb = "ẩn"
                                            }
                                            find++
                                        }else{
                                            info.bb = "ẩn"
                                        }
                                    }else if(!find){
                                        info.bb = "ẩn"
                                    }
                                }
                            }
                        })
                        info.fullname = fullname;
                        info.name = name;
                        var allsvg = Object.values(document.getElementsByTagName('svg'))
                        allsvg.forEach(a => {
                            if(a.getAttribute('aria-label') == name || a.getAttribute('aria-label') == "Hành động với ảnh đại diện"){
                                info.avt = a.querySelector(' g > image').getAttribute('xlink:href')
                            }
                        })
                    }else{
                        info = "lỗi"
                    }
                    return info
                })
                return dataend
            }catch(err){
                return {
                    action: "lỗi",
                    err:err
                }
            }
        }

        getUserInfo(id).then(async data => {
            if(data == "lỗi"){
                await hệthống.pagefb.screenshot({'path': `./cơ sở dữ liệu/src/lỗi lấy thông tin/${id}.png`})
                global.môhình.hiểnthị("không thể lấy thông tin "+id+" vào cơ sở dữ liệu/src/lỗi lấy thông tin/" +`${id}.png`,"trình duyệt",0)
                return callback("lỗi")
            }else if(data.action){
                await hệthống.pagefb.screenshot({'path': `./cơ sở dữ liệu/src/lỗi lấy thông tin/${id}.png`})
                global.môhình.hiểnthị("Lỗi chuyển hướng trang" +`${id}.png`,"trình duyệt",0)
                return callback(data.err)
            }
            else{
                global.môhình.hiểnthị(`Người dùng mới: ${id} || ${data.name}`,`cơ sở dữ liệu`,2);
                return callback(null,data)
            }
        }).catch(async err => {
            await hệthống.pagefb.screenshot({'path': `./cơ sở dữ liệu/src/lỗi lấy thông tin/${id}.png`})
            global.môhình.hiểnthị("không thể lấy thông tin người dùng","trình duyệt",0)
            return callback(err)
        })

    },
    bắtđầu:  function(){
        //hiện thị thanh title
        process.title = "Herosky two  ♥♥♥♥";
        console.clear();
        global.môhình = this.môhình
        
        //kiếm tra cài đặt
        this.kiếmtra()

        //đăng nhập fb
        this.đăngnhập()

        //save data
        var savetime = setInterval(async ()=>{
            if(!hệthống.lặp) return;
            for(let datas of hệthống.các_dữ_liệu_cần){
                global.môhình.lưu_tệp_tin(`${datas}.json`,global.data[datas],"cơ sở dữ liệu");   
            }
            //lấy thông tin mafk bị ăn get
            if(!global.client.wait){
                if(global.data.người_dùng.chờ_duyệt.length != 0){
                    var id = global.data.người_dùng.chờ_duyệt[0];
                    if(!global.data.người_dùng.lỗi_chưa_biết.some(i => i == id )){
                        global.client.wait = true
                        hệthống.lấythôngtinngườidùng(id,(err,data) => {
                            if(err) {
                                console.log(err)
                                global.data.người_dùng.chờ_duyệt.splice(global.data.người_dùng.chờ_duyệt.findIndex(i => i == id), 1)
                                global.data.người_dùng.lỗi_chưa_biết.push(id)
                                return  global.client.wait = false
                            }
                            global.data.người_dùng.thông_tin[id] = data
                            global.data.người_dùng.chờ_duyệt.splice(global.data.người_dùng.chờ_duyệt.findIndex(i => i == id), 1)
                            return  global.client.wait = false
                        })    
                    }
                }
                var all_người_dùng = Object.keys(global.data.người_dùng.thông_tin)
                if(all_người_dùng.length != 0 && global.data.người_dùng.chờ_duyệt.length == 0){
                    var id = all_người_dùng[hệthống.cn];
                    if(!global.data.người_dùng.lỗi_chưa_biết.some(i => i == id )){
                        global.client.wait = true
                        hệthống.lấythôngtinngườidùng(id,(err,data) => {
                            if(err) {
                                console.log(err)
                                global.data.người_dùng.lỗi_chưa_biết.push(id)
                                return global.client.wait = false
                            }
                            global.data.người_dùng.thông_tin[id] = data
                            return  global.client.wait = false
                        })
                    }
                    hệthống.cn > all_người_dùng.length ? hệthống.cn = 0 : hệthống.cn++
                }
            }
        },10000)  
    }
};
hệthống.bắtđầu()
