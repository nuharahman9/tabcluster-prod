var slideIdx = 1 
showDiv(1)

// pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js')


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



function getText () { 
    return document.body.innerText; 
}

function showDiv(n) { 
    var i 
    var x = document.getElementsByClassName("tabcluster-slide")
    console.log("x: ", x)
        if (n > x.length) { slideIdx = 1 }
        if (n < 1) { slideIdx = x.length }
        for (i = 0; i < x.length; i++) { 
            x[i].style.display = "none"; 
        }
        if (x[slideIdx - 1]) { 
            console.log(x[slideIdx - 1]); 
            x[slideIdx-1].style.display =  "block"; 
        }
}


function moveDiv(n) { 
    console.log("event: ", n); 
    showDiv(slideIdx += n)
}





// true = show load 
// false = show default 
function showLoad(loading) { 
    var buttons = document.getElementsByClassName("tc-scroll-button"); 
    var x = document.getElementsByClassName("tabcluster-slide"); 
    var load = document.getElementById("tabcluster-loading"); 
    for (i = 0; i < x.length; i++) { 
        x[i].style.display = (!loading && i === 0) ? "block" : "none"; 
    }

    buttons[0].style.display = loading ? "none" : "inherit"; 
    buttons[1].style.display = loading ? "none" : "inherit"; 
    load.style.display = loading ? "block" : "none";


}

async function getNumWindows() { 
    await chrome.tabs.query({ currentWindow: true }).then(tabs => { 
        tabLen = tabs.length 
        $(document).ready(function() {
            $("#tabcluster-numWindows").attr({
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




window.addEventListener('DOMContentLoaded', function() {
    // chrome.runtime.sendMessage({message: "initPyodide"}); pyodide test 
    // add all the events for UI 
    chrome.runtime.sendMessage({ message: "init" })
    document.getElementById("left-scroll").addEventListener('click', () => moveDiv(-1)); 
    document.getElementById("right-scroll").addEventListener('click', () => moveDiv(1)); 
    document.getElementById("tc-exit").addEventListener('click', () => window.close()); 


    var numWindows = document.getElementById('tabcluster-numWindows'); 
    let observer = new IntersectionObserver(getNumWindows, options); 
    observer.observe(numWindows); 
    

    // functionality for querying tabs
    var txtCapture = document.getElementById('textCapture'); 
    var domainNm = document.getElementById('clusterDomain'); 
    var tabsToSend = []; 
    if (txtCapture !== null && numWindows !== null) {
        txtCapture.addEventListener('click', async () => {
            try { 
                showLoad(true);
                const tabs = await chrome.tabs.query({ currentWindow: true }); 
                let promises = await tabs.map(async tab => {
                    const url = tab.url 
                    return chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: getText, 
                        args: [ url ]
                    }).then(text => {
                        tabsToSend.push({url: tab.url, id: tab.id, text: `\n${tab.url}\n${tab.title}\n${text[0].result}` })
                        
                    }).catch(e => { 
                        console.error("error: ", e)
                    })
                    ;
                });
                await Promise.all(promises);
                console.log("[popup.js] Tabs to send: ", tabsToSend)
                let pdf = async (tabsToSend) => { 
                    for (let i = 0; i < tabsToSend.length; i++) { 
                        if (tabsToSend[i]['url'].includes('pdf')) { 
                            await getPDFContent(tabsToSend[i]['url']).then(c => tabsToSend[i]['text'] = `\n${tabsToSend[i]['url']}\n${tabsToSend[i]['title']}\n${c}`)
                        }
                    }
                }; 
                
                await pdf(tabsToSend); 
                console.log(tabsToSend)

                let data = {
                    message: 'sendText',
                    tabs: tabsToSend,
                    len: tabsToSend.length, 
                    numWindows: numWindows  .value ? numWindows.value : -1
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

    chrome.tabGroups.onUpdated.addListener(showLoad(false)); 

}); 
