
importScripts('./pyodide/xhrshim.js')
self.XMLHttpRequest = self.XMLHttpRequestShim 
importScripts('./pyodide/pyodide.js')
importScripts('./pyodide/pyodide.asm.js')


let modifyData;
let micropip; 
let pyodide;
loadPyodide({}).then((_pyodide) => {
    pyodide = _pyodide;
    console.log("pyodide loaded\n")
});



// ========================== pyodide ==========================


function rearrangeTabsv2(tabGroups) {
    for (const topic in tabGroups) { 
        let tabIds = tabGroups[topic]
        console.log(tabIds)
        if (tabIds.length) { 
            chrome.tabs.group({ tabIds: tabIds }, groupId => { 
                

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

    rearrangeTabsv2(domain_tabIds)
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
        rearrangeTabsv2(json.groups)
    }

}


async function sendTextv2(tabs) { 
    const response = fetch('http://127.0.0.1:5000/upload-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tabs: tabs })
      })
      .catch(error => { 
          console.error("[sendTextv2] something went wrong: ", error)
      });
      
    return response; 
      
}



async function sendTextv3(tabs) { 
    await pyodide.loadPackage("micropip"); 
    const micropip = pyodide.pyimport("micropip"); 
    let test = pyodide.runPython(`
    import micropip 
    import json 
    def test(x):
        print("python: ")
        y = json.loads(x)
        print(type(y))
        print("tab: ", y[0]['tab'])
        print("tab url:", y[0]['tab']['url'])
        return y; 
    test`);


    let res = test(JSON.stringify(tabs))
    res.destroy(); 
}





// communication with popup script 
chrome.runtime.onMessage.addListener(async (data, sender, sendResponse) => {


    if (data.message == "sendText") { 
        const tabs = data.tabs; 
        const len = data.length; 
        console.log("tabs: ", tabs); 
        const numWindows = data.numWindows
        const response = await sendTextv3(tabs); 
        if (response.status === 200) { 
            cluster(numWindows); 
        } else { 
            console.error("[Chrome Runtime Listener] Cluster failed.")
        }

    }

    else if (data.message === 'clusterUrl') { 
        chrome.tabs.query({ currentWindow: true }, tabs => groupByDomain(tabs)); 
    }

    else if (data.message === 'getNumWindows') { 
        console.log("bg js  get numWindows")
        chrome.tabs.query({ currentWindow: true }, tabs => sendResponse({ numWindows: tabs.length })); 
    }



});



