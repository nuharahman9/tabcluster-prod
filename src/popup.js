// const isFirefox = navigator.userAgent.includes('Firefox');
// const pdfjsLib = window['./pdfjs-dist/build/pdf'];
// pdfjsLib.GlobalWorkerOptions.workerSrc = './pdfjs-dist/pdf.worker.mjs';

// console.log(pdfjsLib)

var slideIdx = 1 
showDiv(1)

document.getElementById('left-scroll').addEventListener('click', () => moveDiv(-1)); 
document.getElementById('right-scroll').addEventListener('click', () => moveDiv(+1))


// async function getPDFContent(tabUrl) { 
//     console.log(tabUrl)
//     const pdf = await getDocument({
//         url: tabUrl, 
//         cMapUrl: '../node_modules/pdfjs-dist/cmaps/', 
//         cMapPacked: true
//     }).promise.then(function (pdf) {
//         var pages = pdf.numPages
//         console.log(pdf)
//     })
// }



function moveDiv(n) { 
    showDiv(slideIdx += n)
}

function getTextContent () { 
    return document.body.innerText; 
}

function showDiv(n) { 
    var i 
    var x = document.getElementsByClassName("slide")
    if (n > x.length) { slideIdx = 1 }
    if (n < 1) { slideIdx = x.length }
    for (i = 0; i < x.length; i++) { 
        x[i].style.display = "none"; 
    }
    // fix this later - keeps throwing an error !!! 
    console.log(x[slideIdx-1])
    x[slideIdx-1].style.display =  "block"
}


function showLoad() { 
    var buttons = document.getElementsByClassName("scroll-button"); 
    var x = document.getElementsByClassName("slide"); 
    var load = document.getElementById("loading"); 
    for (i = 0; i < x.length; i++) { 
        x[i].style.display = "none"; 
    }
    buttons[0].style.display = "none"; 
    buttons[1].style.display = "none"; 

    load.style.display = "block"; 
}

async function getNumWindows() { 
    await chrome.tabs.query({ currentWindow: true }).then(tabs => { 
        tabLen = tabs.length 
        console.log("num windows: ", tabLen)
        $(document).ready(function() {
            $("#numWindows").attr({
                "min": 1, 
                "max": tabLen
            })
        })

    }); 
}

let options = {
    root: window, 
    rootMargin: "0px", 
    threshold: 1.0, 
}; 

let observer = new IntersectionObserver(getNumWindows, options)

let target = document.querySelector("#numWindows"); 
observer.observe(target); 


window.addEventListener('DOMContentLoaded', function() {
    var txtCapture = document.getElementById('textCapture')
    var numWindows = document.getElementById('numWindows'); 
    var domainNm = document.getElementById('clusterDomain'); 
    var tabsToSend = [] 
    txtCapture.addEventListener('click', async () => {
        await chrome.tabs.query({ currentWindow: true }).then(tabs => { 
            let promises = tabs.map(tab => {
                console.log(tab.url)
                return chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: getTextContent,   
                    args: [ tab.url ]
                }).then(text => {
                    console.log("text len: ", text.length)
                    tabsToSend.push({tab: tab, text: text[0].result })
                }).catch(e => { 
                    console.error("error: ", e)
                })
                ;
            });

            Promise.all(promises).then(() => {
                let data = { 
                    message: 'sendText',
                    tabs: tabsToSend, 
                    numWindows: numWindows.value ? numWindows.value : -1  // to do: add functionality for when windows is not input 
                }
                console.log("data: ", data)
               this.chrome.runtime.sendMessage(data); 
               showLoad(); 
            }).catch(error => {
                console.error("err: ", error);
            });

        })

    }); 

    domainNm.addEventListener('click', () => {
        this.chrome.runtime.sendMessage({
            message: 'clusterUrl'
        }); 
        showLoad(); 
    })



}); 

