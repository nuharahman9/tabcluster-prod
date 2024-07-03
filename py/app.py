from flask import Flask, request, jsonify
from websiteTopicModel import websiteTopicModel
import os

app = Flask(__name__)

UPLOAD_FOLDER = '../corpus'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

nmf_model = None 

url_id_map = {} 



def cleanup(): 
    print("in cleanup\n")
    for filepath, id in url_id_map.items(): 
        if os.path.exists(filepath): 
            try: 
                os.remove(filepath)
                print(f"{filepath} deleted\n")
            except Exception as e: 
                print("An error occured deleting files: {e}")





@app.route('/cluster', methods=['POST'])
def cluster(): 
    global url_id_map 
    global nmf_model

    print("app.py: in cluster\n")
    data = request.get_json()
    numWindows = data.get('numWindows', -1)
    numWindows = int(numWindows)
    
    topics_website_ids_map = {}
    print("\n==========================================APP.PY URL TO ID====================================\n")
    print(url_id_map)
    print("\n==========================================APP.PY URL TO ID ====================================\n")
    print("in cluster!!!\n")
    if nmf_model is None: 
        nmf_model = websiteTopicModel(n_components=numWindows) 
        topic_doc_map = nmf_model.driver() 
    else: 
        topic_doc_map = nmf_model.recluster(new_components=numWindows)
    print("\n==========================================APP.PY RETURNED OUTPUT====================================\n")
    print(topic_doc_map)
    print("\n==========================================APP.PY RETURNED OUTPUT====================================\n")
    if topic_doc_map:  
        for topicNum, file_paths in topic_doc_map.items(): 
            print(f"Topic {topicNum}:")
            for file in file_paths: 
                print(f"  - {file}")
                if topicNum not in topics_website_ids_map: 
                    topics_website_ids_map[topicNum] = [url_id_map[file]]
                else: 
                    topics_website_ids_map[topicNum].append(url_id_map[file])
        print(topics_website_ids_map) 
        print(jsonify(topics_website_ids_map))
        cleanup()
        return jsonify({
            'groups': topics_website_ids_map, 
            'status': 200, 
            'message': 'Success'
        })
    else: 
        return jsonify({
            'status': 400, 
            'message': 'something went wrong.'
        })


@app.route('/upload', methods=['POST']) 
def upload_text():
    print("upload_text")
    data = request.get_json()
    url = data.get('url')
    id = data.get('id')
    title = data.get('title')
    text = data.get('text')
    global url_id_map
    if url and text:
        filename = url.replace('http://', '').replace('https://', '').replace('/', '_')
        # truncate file name 
        filename = filename[:20] if len(filename) > 20 else filename 
        filename += '.txt'
        filepath = os.path.join(UPLOAD_FOLDER, filename) # create file under tab id 
        url_id_map[filepath] = id 
        with open(filepath, 'a', encoding='utf-8') as file:
            file.write(url) 
            file.write('\n')
            file.write(title)
            file.write('\n')
            file.write(text)
        return jsonify({ 'url': url, 'id': id, 'status': 200 })
    else:
        return jsonify({ 'reason': 'Invalid data', 'status': 400, 'url': url})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
