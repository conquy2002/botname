module.exports = function() {
	 info = {
 		name: "menu",                                                        //tên lệnh dùng trong tin nhắn
		description: "Xem các lệnh của bot",                                 //mô tả
        admin: false,                                                        // dành cho admin không
		using: global.cấu_hình.tiền_tố + "menu",                            // cách sử dụng
        module: []                                                           // các modules đi kèm ví dụ ["readline","fs"]
    };
    function show(event,args,array){
        var limit = 10;
        var msg = "Các lệnh của bot:\n";
        var page = 1;
        var numPage = Math.ceil(array.length/limit);
        page = parseInt(event.args[args]) || 1;
        page < -1 ? page = 1 : "";
        for(var i = limit*(page - 1); i < limit*(page-1) + limit; i++){
            if(i >= array.length) break;
            msg += `${i+1}. ${array[i].info.name} (${array[i].info.description}) \n`
        }
        array.length > limit ?  msg += `--Trang ${page}/${numPage}--` : "";
        return msg
    }
    run = async function({api,event}){
        var nor = [];
        var admin = [];
        for(let i in global.plugin){
            if(global.plugin[i].info.name != "menu"){
                !global.plugin[i].info.admin ? nor.push(global.plugin[i]) : admin.push(global.plugin[i]);
            }
        }
        if(event.args[0] == "help"){
            if(!global.plugin[event.args[1]]) return api.sendMessage("Không có lệnh này",event.threadID,event.messageID);
            return api.sendMessage("Cách dùng: "+global.cấu_hình.tiền_tố + global.plugin[event.args[1]].info.using ,event.threadID , event.messageID);
        }else
        if(event.args[0] == "admin"){return api.sendMessage(show(event,1,admin) + `+ ${global.cấu_hình.tiền_tố} menu trang số \n+ ${global.cấu_hình.tiền_tố} menu help tên lệnh`, event.threadID, event.messageID)}
        else{return api.sendMessage(show(event,0,nor) + `+ ${global.cấu_hình.tiền_tố} menu trang số \n + ${global.cấu_hình.tiền_tố} menu help tên lệnh`, event.threadID, event.messageID)} 
    }
    return{
    	info,
    	run
    }
}
