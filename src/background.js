// recieves groups for tabs
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js')


let tabsToSend = {} 

function getText() { 
    return document.body.innerText; 
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






function rearrangeTabs(tabGroups) { 
    console.log(tabGroups)
    for (const topic in tabGroups) { 
        let tabIds = tabGroups[topic]
        if (tabIds.length) {  // needs to have better error handling 
            chrome.windows.create({ tabId: tabIds[0] }, newWindow => { 
                tabIds.shift() 
                chrome.tabs.move(tabIds, { index: 0, windowId: newWindow.id })
            })
        }
    }
}

// call cluster by url 
function groupByDomain(tabs) { 
    let domain_tabIds = {}
    for (let tab of tabs) { 
        let url = tab.url 
        var pathArr = url.split('/')
        var host = pathArr[2]
        if (domain_tabIds[host]) {
            let curr = domain_tabIds[host]
            curr.push(tab.id)
            domain_tabIds[host] = curr
        } else { 
            domain_tabIds[host] = [tab.id]
        }
    }

    console.log("groupbyDomain: ", domain_tabIds)

    rearrangeTabs(domain_tabIds)
}



// call cluster method using NMF 
async function cluster(numWindows) { 
    console.log('js in cluster')
    const response = await fetch('http://127.0.0.1:5000/cluster', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }, 
        body: JSON.stringify({ 
            numWindows: numWindows
        })
    })

    const json = await response.json()
    console.log("JSON RESPONSE: ", json)
    if (json.status === 200) { 
        rearrangeTabs(json.groups)
    }

}

// sends text content of website to flask 
async function sendText(tab, text) {
    console.log("text length: ", text.length)
    const response = fetch('http://127.0.0.1:5000/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: tab.id, url: tab.url, title: tab.title, text: text })
    })
    

    console.log(response)
}



// communication with popup script 
chrome.runtime.onMessage.addListener(async (data, sender, sendResponse) => {
    if (data.message == "sendText") { 
        const tabs = data.tabs
        console.log("tabs: ", tabs); 
        const numWindows = data.numWindows
        let promises = tabs.map(tab => {
            return sendText(tab.tab, tab.text)
        })

        Promise.all(promises).then(() => cluster(numWindows)); 

    }

    else if (data.message === 'clusterUrl') { 
        chrome.tabs.query({ currentWindow: true }, tabs => groupByDomain(tabs)); 
    }

    else if (data.message === 'getNumWindows') { 
        console.log("bg js  get numWindows")
        chrome.tabs.query({ currentWindow: true }, tabs => sendResponse({ numWindows: tabs.length })); 
    }



});



