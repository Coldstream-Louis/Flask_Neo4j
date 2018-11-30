#!/usr/bin/env python
import os
from json import dumps
import json
from flask import Flask, g, Response, request

from neo4j.v1 import GraphDatabase, basic_auth, Path, Node, Relationship, Entity
from neo4j.v1 import types

app = Flask(__name__, static_url_path='/static/')

password = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver('bolt://localhost',auth=basic_auth("neo4j", password))

def get_db():
    if not hasattr(g, 'neo4j_db'):
        g.neo4j_db = driver.session()
    return g.neo4j_db

@app.teardown_appcontext
def close_db(error):
    if hasattr(g, 'neo4j_db'):
        g.neo4j_db.close()

#返回所有的实体类节点和他们之间的关系
@app.route("/graph")
def get_graph():
    db = get_db()
    results = db.run("MATCH p=(n:Entity)-[r]->(m:Entity) "
                     "RETURN p as nodesrelation")
    results2 = db.run("MATCH (k:Entity) "
                      "RETURN id(k) as id, k.name as name, k.entityType as entityType")
    allNodes = []
    allRels = []
    for rec in results2:
        node_id = rec['id']
        name = rec['name']
        type = rec['entityType']
        allNodes.append({"id": node_id, "name": name, "entityType": type})
    for record in results:
        path = record["nodesrelation"]
        relations = path.relationships
        for rel in relations:
            source = rel.start
            target = rel.end
            relation_1 = rel.get("relation_1")
            relation_2 = rel.get("relation_2")
            allRels.append({"source": source, "target": target, "relation_1": relation_1, "relation_2": relation_2})
    response = Response(dumps({"nodes": allNodes, "links": allRels}),mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#返回两个节点之间的最短路径（最多为5跳，大于5跳则显示无路径）
@app.route("/shortestPath", methods = ['POST'])
def get_path():
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    name_1 = data['name_1']
    name_2 = data['name_2']
    print(name_1)
    print(name_2)
    db = get_db()
    results = db.run("MATCH p=shortestPath((a{name:$name_1})-[*..5]-(b{name:$name_2})) "
                     "RETURN p as nodesrelation ", name_1=name_1, name_2=name_2)
    allNodes = []
    allRels = []
    for record in results:
        path = record["nodesrelation"]
        nodes = path.nodes
        relations = path.relationships
        for node in nodes:
            node_id = node.id
            name = node.get("name")
            nodeType = node.get("nodeType")
            entityType = node.get("entityType")
            allNodes.append({"id": node_id, "name": name, "nodeType": nodeType, "entityType": entityType})
        for rel in relations:
            source = rel.start
            target = rel.end
            relation_1 = rel.get("relation_1")
            relation_2 = rel.get("relation_2")
            allRels.append({"source": source, "target": target, "relation_1": relation_1, "relation_2": relation_2})
    response = Response(dumps({"nodes": allNodes, "links": allRels}), mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#修改实体节点的属性
@app.route("/edit_node", methods = ['POST'])
def edit_node():
    state = 'operation failed'
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    old_name = data['old_name']
    new_name = data['new_name']
    new_entityType = data['new_entityType']
    mission_change = data['mission_id']
    status = data['status']
    print(status)
    db = get_db()
    results = db.run("MATCH (a:Entity{name:$old_name}) "
             "SET a.name = $new_name "
             "SET a.entityType = $new_entityType "
             "SET a.mission_"+mission_change+" = $status "
             "RETURN a.name as final_name"
             , old_name=old_name, new_name = new_name, new_entityType = new_entityType, status = status)
    print(new_name)
    for record in results:
        if record['final_name'] == new_name:
            state = 'operation succeeded'
    response = Response(dumps({"state": state}), mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#修改实体节点之间的关系的属性
@app.route("/edit_link", methods = ['POST'])
def edit_link():
    state = 'operation failed'
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    source = data['source']
    target = data['target']
    new_relation_1 = data['new_relation_1']
    new_relation_2 = data['new_relation_2']
    db = get_db()
    results = db.run("MATCH (a:Entity) WHERE id(a) = $source "
                     "MATCH (b:Entity) WHERE id(b) = $target "
                     "MATCH (a)-[r]->(b) "
                     "SET r.relation_1 = $new_relation_1 "
                     "SET r.relation_2 = $new_relation_2 "
                     "RETURN r.relation_1 as final_relation"
                     , source = source, target = target, new_relation_1 = new_relation_1, new_relation_2 = new_relation_2)
    for record in results:
        if record['final_relation'] == new_relation_1:
            state = "operation succeeded"
    response = Response(dumps({"state": state}),
                    mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#添加一个新的实体类节点
@app.route("/add_node", methods = ['POST'])
def add_node():
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    name = data['name']
    nodeType = "实体"
    entityType = data['entityType']
    i = '0'
    db = get_db()
    results = db.run("CREATE (a:Entity{name:$name, nodeType:$nodeType, entityType:$entityType, mission_1:$i, mission_2:$i, mission_3:$i, mission_4:$i, mission_5:$i, mission_6:$i, mission_7:$i, mission_8:$i}) "
                     "RETURN id(a) as id, a.name as name, a.entityType as entityType " , name = name, entityType = entityType, nodeType = nodeType, i = i)
    for record in results:
        new_id = record['id']
        new_name = record['name']
        new_type = record['entityType']
    response = Response(dumps({"id": new_id, "name": new_name, "entityType": new_type}),
                    mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#添加一个新的关系
@app.route("/add_link", methods = ['POST'])
def add_link():
    state = 'operation failed'
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    source = data['source']
    target = data['target']
    relation_1 = data['relation_1']
    relation_2 = data['relation_2']
    db = get_db()
    results = db.run("MATCH (from) WHERE id(from) = $source "
                     "MATCH (to) WHERE id(to) = $target "
                     "MERGE (from)-[r:rel{relation_1: $relation_1, relation_2: $relation_2}]->(to) "
                     "RETURN r.relation_1 as new_relation " , source = source, target = target, relation_1 = relation_1, relation_2 = relation_2)
    for record in results:
        if record['new_relation'] == relation_1:
            state = "operation succeeded"
    response = Response(dumps({"state": state}),
                    mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#搜索一个实体节点并返回与它有关系的所有节点
@app.route("/search", methods = ['POST'])
def search():
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    name = data['name']
    db = get_db()
    results = db.run("MATCH (a:Entity) WHERE a.name contains $name "
                     "MATCH p = (a)-[]-(b:Entity) "
                     "RETURN p as nodesrelation", name = name)
    allNodes = []
    allRels = []
    for record in results:
        path = record["nodesrelation"]
        nodes = path.nodes
        relations = path.relationships
        for node in nodes:
            node_id = node.id
            name = node.get("name")
            type = node.get("entityType")
            is_repeated = 0
            for n in allNodes:
                if n["id"] == node_id:
                    is_repeated = 1
                    break
            if is_repeated == 0:
                allNodes.append({"id": node_id, "name": name, "entityType": type})
        for rel in relations:
            source = rel.start
            target = rel.end
            relation_1 = rel.get("relation_1")
            relation_2 = rel.get("relation_2")
            allRels.append({"source": source, "target": target, "relation_1": relation_1, "relation_2": relation_2})
    response = Response(dumps({"nodes": allNodes, "links": allRels}),
                    mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#搜索任务编号并返回工作图谱
@app.route("/search_mission", methods = ['POST'])
def search_mission():
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    mission_id = data['mission_id']
    mission_id = "mission_"+mission_id
    r_mission_id = "任务"+data['mission_id']
    db = get_db()
    results = db.run("MATCH p = (a:Concept{"+mission_id+":'1'})-[r{mission_id:$r_mission_id}]-(b{"+mission_id+":'1'}) "
                     "RETURN p as nodesrelation", r_mission_id = r_mission_id)
    allNodes = []
    allRels = []
    for record in results:
        path = record["nodesrelation"]
        nodes = path.nodes
        relations = path.relationships
        for node in nodes:
            node_id = node.id
            name = node.get("name")
            entityType = node.get("entityType")
            nodeType = node.get("nodeType")
            is_repeated = 0
            for n in allNodes:
                if n["id"] == node_id:
                    is_repeated = 1
                    break
            if is_repeated == 0:
                allNodes.append({"id": node_id, "name": name, "entityType": entityType, "nodeType": nodeType})
        for rel in relations:
            source = rel.start
            target = rel.end
            mission_id = rel.get("mission_id")
            allRels.append({"source": source, "target": target, "mission_id": mission_id})
    response = Response(dumps({"nodes": allNodes, "links": allRels}),
                    mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#将一个实体节点添加到某任务中，并和某个概念节点相连
@app.route("/add_to_mission", methods = ['POST'])
def add_to_mission():
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    entity_id = data['entity_id']
    concept_id = data['concept_id']
    mission_id = data['mission_id']
    r_mission_id = "任务"+mission_id
    i = '1'
    db = get_db()
    results = db.run("MATCH (n:Entity) WHERE id(n) = $entity_id "
                     "MATCH (c:Concept) WHERE id(c) = $concept_id "
                     "SET n.mission_"+mission_id+" = $i "
                     "MERGE (c)-[r:rel_CE{mission_id:$r_mission_id}]->(n) "
                     "RETURN r.mission_id as mission_id", entity_id = entity_id, concept_id = concept_id, r_mission_id = r_mission_id, i = i)
    for record in results:
        if record['mission_id'] == r_mission_id:
            state = "operation succeeded"
    response = Response(dumps({"state": state}),
                    mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response

#将一个实体节点从某任务的工作图谱中删除
@app.route("/delete_from_mission", methods = ['POST'])
def delete_from_mission():
    if not request.data:
        return ('fail')
    data = json.loads(request.data.decode('utf-8'))
    entity_id = data['entity_id']
    mission_id = data['mission_id']
    r_mission_id = "任务"+mission_id
    i = '0'
    db = get_db()
    results = db.run("MATCH (n:Entity) WHERE id(n) = $entity_id "
                     "MATCH (c)-[r:rel_CE{mission_id:$r_mission_id}]->(n) "
                     "SET n.mission_"+mission_id+" = $i "
                     "DELETE r "
                     "RETURN n.mission_"+mission_id+" as mission_state", entity_id = entity_id, r_mission_id = r_mission_id, i = i)
    for record in results:
        if record['mission_state'] == '0':
            state = "operation succeeded"
    response = Response(dumps({"state": state}),
                    mimetype="application/json")
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST'
    response.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
    return response
    
if __name__ == '__main__':
    app.run(port=8000)
