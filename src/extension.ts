 
import * as wing from 'wing';
import * as path from 'path';

import * as fs from 'fs';

var extendPath = ""; //扩展路径
var configPath = ""; //配置路径
var globalPath = ""; //文件路径

export function activate(context: wing.ExtensionContext) {
    extendPath = context.extensionPath;
    configPath = path.join(context.extensionPath, "/out/config.json");
    var html = wing.Uri.file(path.join(context.extensionPath, 'web/index.html'));
    wing.window.webviews.forEach(function (webview) {
        webviewAdded(webview);
    });
    wing.window.onDidCreateWebView(function (webview) {
        webviewAdded(webview);
    });
    wing.commands.registerCommand('extension.testcode', function () {
        previewWebView(html);
    });
}
 
function webviewAdded(webview) {
    webview.addEventListener('ipc-message', function (message) {
        if (message.args[0] == "MSG_CREATE") {
            saveTestCode(message.args[1]);
        }
        else if (message.args[0] == "MSG_INSERTER") {
            insertCode(message.args[1]);
        }
    });
}
//插入代码
function insertCode(fileName) {
    if (fileName == "SINGLE") {
        createSingle();
        return;
    }
    if (fileName == "CLASS") {
        createClass();
        return;
    }
    if (fileName == "DisplayObjectContainer") {
        createContainer();
        return;
    }
    var curfileStr = fs.readFileSync(configPath, "utf-8");
    var json = JSON.parse(curfileStr);
    var textCode = getTempleCode(extendPath, json, fileName);
    var array = textCode.split('\n');
    var temp = "";
    for (var i = 0; i < array.length; i++) {
        temp += "\t\t" + array[i];
    }
    var pos = wing.window.activeTextEditor.selection.active;
    wing.window.activeTextEditor.edit(function (edit) {
        edit.insert(new wing.Position(pos.line, 0), temp);
    });
}
function createSingle() {
    var e = wing.window.activeTextEditor;
    if (!e) {
        return;
    }
    var className = path.basename(e.document.fileName, ".ts");
    var textCode = "private static instance:" + className + ";\n\t public static getInstance():" + className + "{      \n\t    if(!" + className + ".instance){\n\t\t\t " + className + ".instance  = new  " + className + "();\n\t\t }\n         return " + className + ".instance;        \n\t }";
    wing.window.activeTextEditor.edit(function (edit) {
        var line = wing.window.activeTextEditor.selection.active;
        edit.insert(line, textCode);
    });
}
function createClass() {
    var e = wing.window.activeTextEditor;
    if (!e) {
        return;
    }
    var className = path.basename(e.document.fileName, ".ts");
    var textCode = "class " + className + " {\n    constructor() {\n        \n    }\n    private init():void\n    {\n        \n    }\n}";
    wing.window.activeTextEditor.edit(function (edit) {
        edit.insert(new wing.Position(0, 0), textCode);
    });
}
function createContainer() {
    var e = wing.window.activeTextEditor;
    if (!e) {
        return;
    }
    var className = path.basename(e.document.fileName, ".ts");
    var textCode = "class " + className + " extends egret.DisplayObjectContainer {\n    constructor() {\n        super();\n    }\n    private init():void\n    {\n        \n    }\n}";
    wing.window.activeTextEditor.edit(function (edit) {
        edit.insert(new wing.Position(0, 0), textCode);
    });
}
/**
 * name
 */
function getTempleCode(extendPath, json, seletName) {
    var list = json["temple"];
    var str = "";
    for (var i = 0; i < list.length; i++) {
        if (list[i].name == seletName) {
            var curPath = extendPath + "/" + list[i].url;
            var curfileStr = fs.readFileSync(curPath, "utf-8");
            return curfileStr;
        }
    }
    return str;
}
function saveTestCode(fileName) {
    var rootPath = wing.workspace.rootPath;
    if (!rootPath) {
        return;
    }
    var targetPath = rootPath + "\\src\\" + fileName + ".ts";
    if (!fs.exists(targetPath)) {
        var curfileStr = fs.readFileSync(configPath, "utf-8");
        var json = JSON.parse(curfileStr);
        var textCode = getTempleCode(extendPath, json, fileName);
        writeFile(targetPath, textCode);
    }
    else {
        wing.window.showWarningMessage("文件已经存在了是否继续？", "YES", "NO").then(function (value) {
            if (value == "YES") {
                var curfileStr = fs.readFileSync(configPath, "utf-8");
                var json = JSON.parse(curfileStr);
                var textCode = getTempleCode(extendPath, json, fileName);
                writeFile(targetPath, textCode);
            }
        });
    }
}
function writeFile(fileName, data) {
    fs.writeFile(fileName, data, 'utf-8', complete);
    function complete(err) {
        if (!err) {
            console.log("文件生成成功");
        }
    }
}
function previewWebView(html) {
    wing.complexCommands.previewWebView(html, 'EgretGOGOGO');
}
 