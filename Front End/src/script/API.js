import $ from './lib/jquery-3.3.1.min'

// Show all entity nodes
function basic() {
    var nodeslink;
    $.ajax({
        type:"get",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/graph",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        success:function(res){
            nodeslink = res;
        },
        error:function(res){
            console.log("Something wrong with basic!")
        }
    });
    return nodeslink;
}

// Show the shortest path of two nodes
function shortestPath(name_1, name_2) {
    var x = JSON.stringify({"name_1":name_1, "name_2":name_2});
    console.log(x);
    var nodeslink;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/shortestPath",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: x,
        success:function(res){
            nodeslink = res;
        },
        error:function(res){
            console.log("Something wrong with shortestPath!")
        }
    });
    return nodeslink;
}

// Show the special knowledge graph of the mission
function missionKG(mission_id) {
    var x = JSON.stringify({"mission_id":mission_id});
    console.log(x);
    var nodeslink;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/search_mission",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: x,
        success:function(res){
            nodeslink = res;
        },
        error:function(res){
            console.log("Something wrong with missionKG!")
        }
    });
    return nodeslink;
}

// Show all the nodes which have relation with this node
function neighbors(name) {
    var x = JSON.stringify({"name":name});
    console.log(x);
    var nodeslink;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/search",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: x,
        success:function(res){
            nodeslink = res;
        },
        error:function(res){
            console.log("Something wrong with neighbors!")
        }
    });
    return nodeslink;
}

// Edit node
function editNode(old_name, new_name, new_entityType, mission_id, status) {
    var x = JSON.stringify({"old_name":old_name,"new_name":new_name,"new_entityType":new_entityType,"mission_id":mission_id,"status":status});
    console.log(x);
    var state;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/edit_node",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: x,
        success:function(res){
            state = res;
        },
        error:function(res){
            console.log("Something wrong with editNode!")
        }
    });
    return state;
}

// Edit link
function editLink(source, target, new_relation_1, new_relation_2) {
    var x = JSON.stringify({"source":source, "target":target, "new_relation_1":new_relation_1, "new_relation_2":new_relation_2});
    console.log(x);
    var state;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/edit_link",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: x,
        success:function(res){
            state = res;
        },
        error:function(res){
            console.log("Something wrong with editLink!")
        }
    });
    return state;
}

// Add a link between 2 existing entity nodes
function addLink(source, target, relation_1, relation_2) {
    var x = JSON.stringify({"source":source, "target":target, "relation_1":relation_1, "relation_2":relation_2});
    console.log(x);
    var state;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/add_link",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: x,
        success:function(res){
            state = res;
        },
        error:function(res){
            console.log("Something wrong with addLink!")
        }
    });
    return state;
}

// Add a link between an existing entity node and a new node
function addLinkToNode(source, name, entityType, relation_1, relation_2) {
    var x = JSON.stringify({"name":name, "entityType":entityType});
    console.log(x);
    var newNode;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/add_node",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: x,
        success:function(res){
            newNode = res;
        },
        error:function(res){
            console.log("Something wrong with addLink!")
        }
    });
    var target = newNode.id;
    var y = JSON.stringify({"source":source, "target":target, "relation_1":relation_1, "relation_2":relation_2});
    console.log(y);
    var state;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/add_link",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: y,
        success:function(res){
            state = res;
        },
        error:function(res){
            console.log("Something wrong with addLink!")
        }
    });
    return state;
}

// Replace an entity node in the mission KG with another existing entity node
function mission_replace(old_entity_id, new_entity_id, mission_id, concept_id) {
    var x = JSON.stringify({"entity_id":old_entity_id, "mission_id":mission_id});
    console.log(x);
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/delete_from_mission",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: x,
        success:function(res){
            console.log(res);
        },
        error:function(res){
            console.log("Something wrong with addLink!")
        }
    });
    var y = JSON.stringify({"entity_id":new_entity_id, "concept_id":concept_id, "mission_id":mission_id});
    console.log(y);
    var state;
    $.ajax({
        type:"post",
        async:false,
        crossDomain: true,
        url:"http://localhost:8000/add_to_mission",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Content-type', 'application/json')
        },
        data: y,
        success:function(res){
            console.log(res);
            state = res;
        },
        error:function(res){
            console.log("Something wrong with addLink!")
        }
    });
    return state;
}
export {basic, shortestPath, missionKG, neighbors, editNode, editLink, addLink, addLinkToNode};
