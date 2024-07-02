from flask import Flask, request, jsonify
from websiteTopicModel import websiteTopicModel
import os

app = Flask(__name__)

UPLOAD_FOLDER = '../corpus'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

nmf_model = None 
url_id_map = {} 


# @app.route('/cleanup', methods=['DELETE']) 
# def cleanup(): 
#     deleted = {} 
#     for filepath in url_id_map: 
#         filepath = filepath.replace(filepath[0], "", 1)
#         if os.path.exists(filepath): 
#             os.remove(filepath)
#             deleted.append(filepath)
#         else: 
#             return jsonify({
#                 'status': 500,
#                 'message': "failed to delete file path", 
#                 'filepath': filepath
#             })
#     return jsonify({
#         'status': 200,
#         'message': 'all files successfully deleted', 
#         'deleted': deleted
#     })




@app.route('/cluster', methods=['POST'])
def cluster(): 
    # add something here that takes the number of windows and init nmf here instead - still need to grab this from javascript 
    global nmf_model
    global url_id_map 
    print("app.py: in cluster\n")
    data = request.get_json()
    numWindows = data.get('numWindows', -1)
    numWindows = int(numWindows)
    nmf_model = websiteTopicModel(n_components=numWindows) 
    topics_website_ids_map = {}
    print("\n==========================================APP.PY URL TO ID====================================\n")
    print(url_id_map)
    print("\n==========================================APP.PY URL TO ID ====================================\n")
    print("in cluster!!!\n")
    topic_doc_map = nmf_model.driver()
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
        return jsonify({
            'groups': topics_website_ids_map, 
            'status': 200, 
            'message': 'biiiitch'
        })
    else: 
        return jsonify({
            'status': 400, 
            'message': 'something went wrong. HELP'
        })


@app.route('/upload', methods=['POST']) 
def upload_text():
    print("upload_text")
    data = request.get_json()
    url = data.get('url')
    id = data.get('id')
    title = data.get('title')
    text = data.get('text')
    print(len(text))
    global url_id_map
    if url and text:
        filename = url.replace('http://', '').replace('https://', '').replace('/', '_')
        # truncate file name 
        filename = filename[:20] if len(filename) > 20 else filename 
        filename += '.txt'
        filepath = os.path.join(UPLOAD_FOLDER, filename) # create file under tab id 
        url_id_map[filepath] = id # doesnt include the . for some reason ... 
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
