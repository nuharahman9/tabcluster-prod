var slideIdx = 1 
showDiv(1)

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js')

var leftScroll = document.getElementById('left-scroll'); 
var rightScroll = document.getElementById('right-scroll'); 

if (leftScroll !== null && rightScroll !== null) { 
    console.log("we did it joe\n"); 
    leftScroll.addEventListener('click', moveDiv(-1)); 
    rightScroll.addEventListener('click', moveDiv(+1)); 
}





async function getPDFContent(pdfUrl) {
    var pdf = pdfjsLib.getDocument(pdfUrl);
    return pdf.promise.then(function (pdf) {
        var totalPageCount = pdf.numPages;
        var countPromises = [];
        for (
            var currentPage = 1;
            currentPage <= totalPageCount;
            currentPage++
        ) {
            var page = pdf.getPage(currentPage);
            countPromises.push(
                page.then(function (page) {
                    var textContent = page.getTextContent();
                    return textContent.then(function (text) {
                        return text.items
                            .map(function (s) {
                                return s.str;
                            })
                            .join('');
                    });
                }),
            );
        }

        return Promise.all(countPromises).then(function (texts) {
            return texts.join('');
        });
    });
}


function moveDiv(n) { 
    showDiv(slideIdx += n)
}

function getText () { 
    return document.body.innerText; 
}

function showDiv(n) { 
    var i 
    var x = document.getElementsByClassName("slide")
    console.log("x: ", x)
        if (n > x.length) { slideIdx = 1 }
        if (n < 1) { slideIdx = x.length }
        for (i = 0; i < x.length; i++) { 
            x[i].style.display = "none"; 
        }
        // fix this later - keeps throwing an error !!! 
        if (x[slideIdx - 1]) { 
            console.log(x[slideIdx - 1]); 
            x[slideIdx-1].style.display =  "block"; 
        }


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
        $(document).ready(function() {
            $("#numWindows").attr({
                "min": 1, 
                "max": tabLen
            })
        })

    }); 
}


let options = {
    root: document, 
    rootMargin: "0px", 
    threshold: 1.0, 
}; 

var target = document.querySelector("#numWindows"); 
let observer = new IntersectionObserver(getNumWindows, options)
if (target !== null) { 
    observer.observe(target); 
}





window.addEventListener('DOMContentLoaded', function() {
    var txtCapture = document.getElementById('textCapture'); 
    var numWindows = document.getElementById('numWindows'); 
    var domainNm = document.getElementById('clusterDomain'); 
    var tabsToSend = []; 
    if (txtCapture !== null && numWindows !== null) {
        txtCapture.addEventListener('click', async () => {
            try { 
                showLoad();
                const tabs = await chrome.tabs.query({ currentWindow: true }); 
                let promises = await tabs.map(async tab => {
                    const url = tab.url 
                    return chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: getText, 
                        args: [ url ]
                    }).then(text => {
                        tabsToSend.push({tab: tab, text: text[0].result })
                        
                    }).catch(e => { 
                        console.error("error: ", e)
                    })
                    ;
                });
                await Promise.all(promises);
                console.log("[popup.js] Tabs to send: ", tabsToSend)
                let pdf = async (tabsToSend) => { 
                    for (let i = 0; i < tabsToSend.length; i++) { 
                        if (tabsToSend[i]['tab'].url.includes('pdf')) { 
                            await getPDFContent(tabsToSend[i]['tab'].url).then(c => tabsToSend[i]['text'] = c)
                        }

                        console.log(tabsToSend[i]['text']); 
                    }
                }; 
                
                await pdf(tabsToSend); 
                console.log(tabsToSend)

                let data = {
                    message: 'sendText',
                    tabs: tabsToSend,
                    len: tabsToSend.length, 
                    numWindows: numWindows.value ? numWindows.value : -1
                };

                console.log("[popup.js] Sending data:", data);
                chrome.runtime.sendMessage(data);
            } catch (error) {
                console.error("Error querying tabs:", error);
            }

        }); 

        domainNm.addEventListener('click', () => {
            this.chrome.runtime.sendMessage({
                message: 'clusterUrl'
            }); 
            showLoad(); 
        })

    }

}); 
