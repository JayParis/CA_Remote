document.addEventListener("DOMContentLoaded", (event) => { initSite(); });
var socketObj;
var siteLog;
var toggleConsole, consoleVisible = false;
var isRemote = false;

// var websocketURL = 'ws://192.168.1.240:7070';
var websocketURL = 'ws://jayparis.com:3000';
// var websocketURL = 'ws://jayparis.com';
// var websocketURL = 'wss://188.166.147.54:3000';

var cardArray = []

function initSite()
{
    loadCards().then((cds) => {
        document.getElementById('splash').style.display = "none";
        cardArray = cds.split('').map(char => parseInt(char, 10));
        
        // Setup logging
        siteLog = (message) => {
            const newSpan = document.createElement('span');
            newSpan.textContent = message;
            document.getElementById('site-output-id').appendChild(newSpan);
            console.log(message);
        };
        toggleConsole = () => {
            consoleVisible = !consoleVisible;
            document.getElementById('site-output-id').style.display = consoleVisible ? "flex" : "none";
        };
        
        window.document.addEventListener('keydown',(ev) => {
            // if(ev.key.toUpperCase() == 'W') siteLog("Hello from Remote LOG! " + Math.random().toString());
            // if(ev.key.toUpperCase() == 'E') toggleConsole();
        });
    });
    // toggleConsole();
}

function startWebSocketServer()
{
    const socket = new WebSocket(websocketURL);

    socket.addEventListener("open", (event) => {
        siteLog("Connected to WS Server!");
    });

    socket.addEventListener("message", (event) => {
        receivedServerCMD(event.data);
    });

    socketObj = (str) => { socket.send(str); };
    window.sendServerCMDRef = (cmd) => { sendServerCMD(cmd); };
}
function sendServerCMD(cmd) {
    if(socketObj == null || socketObj == undefined) return;
    var prepend = isRemote ? "R" : "G";
    socketObj(prepend + cmd);
}
function receivedServerCMD(cmd) {
    siteLog(cmd);
    if(!isRemote){
        if(window.unityInstance == null || window.unityInstance == undefined) return;
        window.unityInstance.SendMessage("_SERVER", "ReceiveServerCMD", cmd);
    }
}

function initRemote()
{
    isRemote = true;
    startWebSocketServer();
    document.getElementById('init-cont-id').style.display = "none";
    document.getElementById('game-cont-id').style.display = "none";
}

function initGame()
{
    isRemote = false;
    startWebSocketServer();    
    document.getElementById('init-cont-id').style.display = "none";
    document.getElementById('remote-cont-id').style.display = "none";

    window.unityReady = false;
    function onProgress(progress) {
        var loadingVal = Math.min(100,Math.floor(progress * 100)).toString();
        document.getElementById('loading-number-id').innerText = "Loading: " + loadingVal;
    }

    let loadGame = true;
    
    if(loadGame){
        createUnityInstance(document.querySelector("#unity-canvas"), {
            arguments: [],
            dataUrl: "/build/WebGL.data.unityweb",
            frameworkUrl: "/build/WebGL.framework.js.unityweb",
            codeUrl: "/build/WebGL.wasm.unityweb",
            streamingAssetsUrl: "StreamingAssets",
            companyName: "DefaultCompany",
            productName: "CounterAttack",
            productVersion: "0.1.0",
            matchWebGLToCanvasSize: true, // Uncomment this to separately control WebGL canvas render size and DOM element size.
            // devicePixelRatio: 1, // Uncomment this to override low DPI rendering on high DPI displays.
        }, onProgress).then((unityInstance) => {
            window.handleTouch = (typeof window !== 'undefined') && ('ontouchstart' in window || ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0));
            window.unityInstance = unityInstance;
            window.unityReady = true;
            // document.getElementById('unity-canvas-overlay-id').style.display = "none";
            document.getElementById('loading-number-id').style.display = "none";
            bindUnityInputEvents();
        }).catch((message) => {
            alert(message);
        });
    }
    function bindUnityInputEvents(){}
}

async function loadCards(name) {
    let res = await fetch('/assets/obj/cards.txt')
    let data = res.text();
    return data;
}

function previewCards(index)
{
    document.getElementById("card-number-id").innerText = "# " + (index+1).toString();

    var symbolIndex = cardArray[(index * 13) + 12];

    for (let i = 0; i < 6; i++) {
        let destPath = "/assets/images/dot.png";
        let symbolIndex = cardArray[(index * 13) + i];
        let colorIndex = cardArray[(index * 13) + i + 6];

        if(symbolIndex == 0)
        {
            document.getElementById('cs-n-'+i.toString()).src = destPath;
            document.getElementById('cs-f-'+i.toString()).src = destPath;
            continue;
        }
        var prefix = "";
        var suffix = "";

        switch (symbolIndex) {
            default:break;
            case 1: prefix = "circle"; break;
            case 2: prefix = "dotted"; break;
            case 3: prefix = "cross"; break;
        }
        switch (colorIndex) {
            default:break;
            case 0: suffix = "red"; break;
            case 1: suffix = "yellow"; break;
            case 2: suffix = "blue"; break;
            case 3: suffix = "black"; break;
        }

        destPath = "/assets/images/" + prefix + "-" + suffix + ".png";
        document.getElementById('cs-n-'+i.toString()).src = destPath;
        document.getElementById('cs-f-'+i.toString()).src = destPath;
        
    }
}

function getSetupNames()
{
    var t1Arr = [];
    var t2Arr = [];

    for (let i = 0; i < 4; i++) {
        if(String(document.getElementById('t1-name-' + (i+1).toString()).value).length > 1) t1Arr.push(document.getElementById('t1-name-' + (i+1).toString()).value);
        if(String(document.getElementById('t2-name-' + (i+1).toString()).value).length > 1) t2Arr.push(document.getElementById('t2-name-' + (i+1).toString()).value);
    }

    var outStr = "";
    for (let i = 0; i < t1Arr.length; i++) {
        const name = t1Arr[i];
        var sep = i == t1Arr.length-1 ? "" : "|";
        outStr += name + sep;
    }
    outStr += "&";
    for (let i = 0; i < t2Arr.length; i++) {
        const name = t2Arr[i];
        var sep = i == t2Arr.length-1 ? "" : "|";
        outStr += name + sep;
    }

    return outStr;
}

var realChosenArrayIndex = 0;
var realArrayOffset = 17;
selectingCard = false;
otherMenuOpen = false;
function btnMessage(msg){
    
    // if msg isnt in here, send it to the game
    switch (msg) {
        default: break;
        case "init-game": initGame(); return;
        case "init-remote": initRemote(); return;
        case "cancel-card-selection":
            selectingCard = false;
            document.getElementById('card-preview-cont-id').style.display = selectingCard ? "block" : "none";
            return;
        case "choose-normal":
            sendServerCMD("CHOSEN_NOFLIP:" + (realChosenArrayIndex + realArrayOffset).toString());
            selectingCard = false;
            document.getElementById('card-preview-cont-id').style.display = selectingCard ? "block" : "none";
            return;
        case "choose-flipped":
            sendServerCMD("CHOSEN_FLIP:" + (realChosenArrayIndex + realArrayOffset).toString());
            selectingCard = false;
            document.getElementById('card-preview-cont-id').style.display = selectingCard ? "block" : "none";
            return;
        case "wild-steal": sendServerCMD("CHOSEN_SPECIAL:" + (0 + realArrayOffset).toString()); return; // 0
        case "wild-clear": sendServerCMD("CHOSEN_SPECIAL:" + (40 + realArrayOffset).toString()); return; // 40
        case "wild-swap": sendServerCMD("CHOSEN_SPECIAL:" + (70 + realArrayOffset).toString()); return; // 70
        case "wild-reset": sendServerCMD("CHOSEN_SPECIAL:" + (11 + realArrayOffset).toString()); return; // 11

        case "auto-red": sendServerCMD("AUTO_SELECT_RED"); return;
        case "auto-yellow": sendServerCMD("AUTO_SELECT_YELLOW"); return;
        case "auto-blue": sendServerCMD("AUTO_SELECT_BLUE"); return;

        case "open-other-menu":
            otherMenuOpen = true;
            document.getElementById('other-menu-id').style.display = otherMenuOpen ? "flex" : "none";
            return;
        case "close-other-menu":
            otherMenuOpen = false;
            document.getElementById('other-menu-id').style.display = otherMenuOpen ? "flex" : "none";
            return;

        case "start-game":
            var names = getSetupNames();
            sendServerCMD("SETUP:" + names);
            otherMenuOpen = false;
            document.getElementById('other-menu-id').style.display = otherMenuOpen ? "flex" : "none";
            return;
        case "reload-scene": sendServerCMD("RELOAD_GAME"); return;

        case "toggle-draw-cards-graphic": sendServerCMD("TOGGLE_DRAW_CARDS_GRAPHIC"); return;
        case "skip-wild": sendServerCMD("WILD_PROCEED"); return;
        case "toggle-console": sendServerCMD("TOGGLE_CONSOLE"); return;
        case "toggle-player-receives-score": sendServerCMD("TOGGLE_PLAYER_RECEIVES_SCORE"); return;

    }
    if(String(msg).startsWith("submit-card")){
        index = parseInt(String(msg).substring(12));
        realChosenArrayIndex = index-1;
        previewCards(realChosenArrayIndex);
        // console.log(index);
        //index = parseInt
        selectingCard = true;
        document.getElementById('card-preview-cont-id').style.display = selectingCard ? "block" : "none";
        return;
    }

    console.log("SENDING_GAME:" + msg);
    document.getElementById('sending-id').innerText = msg;
    sendServerCMD(msg);
}