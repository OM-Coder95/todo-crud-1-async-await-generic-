const cl = console.log;

const form = document.getElementById("form")
const todoName = document.getElementById("todoName")
const addTodoBtn = document.getElementById("addTodoBtn")
const updateTodoBtn = document.getElementById("updateTodoBtn")
const todoContainer = document.getElementById("todoContainer")
const spinner = document.getElementById("spinner")

let state = {
    todo1: [],
    editId: null
}

const BASE_URL = `https://todo-with-fetch-1-default-rtdb.firebaseio.com`;

const TODO_URL = `${BASE_URL}/todo1.json`;

// functions

// handleSpinner 

function handleSpinner(flag) {
    if (flag) {
        spinner.classList.remove("d-none")
    } else {
        spinner.classList.add("d-none")
    }
}

//snackbar

function snackbar(msg, icon) {
    Swal.fire({
        test: msg,
        icon: icon
    })
}

// objToArr

function objToArr(obj) {
    for (const key in obj) {
        obj[key].id = key;
        state.todo1.push(obj[key]);
    }
}

// makeApiCall

async function makeApiCall(url, methodType, msgbody) {

    try {
        handleSpinner(true);
        let body = msgbody ? JSON.stringify(msgbody) : null;
        let res = await fetch(url, {
            method: methodType,
            body: body,
            headers: {
                "Content-Type": "application/json",
                "authorization": 'JWT TOKEN'
            }
        })

        if (!res.ok) {
            throw new Error(`HTTP ERROR: ${res.status}`);
        }

        let data = await res.json();

        return data;
    } catch (err) {
        console.error("API ERROR: ", err.message);
        throw err;
    }
}

// showOnUI

async function showOnUI() {
    try {

        let data = await makeApiCall(TODO_URL);
        objToArr(data);

        rendering(state.todo1);
    } catch (err) {
        snackbar(err.message, "error");
    } finally {
        handleSpinner(false)
    }
}
showOnUI();

// rendering
function rendering(arr) {
    let result = "";

    arr.forEach(ele => {
        result += `
        <li class="list-group-item d-flex justify-content-between" id="${ele.id}">
                                <strong>${ele.todoItem}</strong>
                                <div>
                                    <button onclick="editTodo(this)" class="btn btn-sm btn-primary">Edit</button>
                                    <button onclick="deleteTodo(this)" class="btn btn-sm btn-danger deleteBtn">Delete</button>
                                </div>
                            </li>
        `
    })
    todoContainer.innerHTML = result;
}

// onTodoAdd
async function onTodoAdd(event) {
    event.preventDefault();

    try {
        let newTodo = {
            todoItem: todoName.value.trim()
        }
        let data = await makeApiCall(TODO_URL, "POST", newTodo)

        newTodo.id = data.name;

        createLI(newTodo);

        form.reset();
    } catch (err) {
        snackbar(err.message, "error");
    } finally {
        handleSpinner(false);
    }
}

// createLI
function createLI(newTodo) {
    let li = document.createElement("li");
    li.id = newTodo.id;
    li.className = `list-group-item d-flex justify-content-between`;

    li.innerHTML = `
                                <strong>${newTodo.todoItem}</strong>
                                <div>
                                    <button onclick="editTodo(this)" class="btn btn-sm btn-primary">Edit</button>
                                    <button onclick="deleteTodo(this)" class="btn btn-sm btn-danger deleteBtn">Delete</button>
                                </div>
    `
    todoContainer.append(li);
}

// editTodo

function editTodo(ele) {
    try {
        let editId = ele.closest("li").id;
        state.editId = editId;

        let allDeleteBtn = document.querySelectorAll("#todoContainer .deleteBtn");
        allDeleteBtn.forEach(ele => ele.disabled = false);

        let liDeleteBtn = ele.closest("li").querySelector(".deleteBtn");
        liDeleteBtn.disabled = true;

        let obj = state.todo1.find(ele => ele.id === editId);

        todoName.value = obj.todoItem;

        addTodoBtn.classList.add("d-none");
        updateTodoBtn.classList.remove("d-none");
    } catch (err) {
        snackbar(err.message, "error");
    } finally {
        handleSpinner(false)
    }
}

// updateTodo
async function onTodoUpdate() {
    try {
        let updateId = state.editId;
        let UPDATE_URL = `${BASE_URL}/todo1/${updateId}.json`;

        let liDeleteBtn = document.getElementById(updateId).querySelector(".deleteBtn")
        liDeleteBtn.disabled = false;

        let updatedObj = {
            todoItem: todoName.value.trim(),
            id: updateId
        }

        let data = await makeApiCall(UPDATE_URL, "PATCH", updatedObj);

        let getIndex = state.todo1.findIndex(ele => ele.id === updateId);
        if (getIndex === -1) {
            snackbar("Todo Not Found");
            return;
        }
        state.todo1[getIndex] = updatedObj;

        updateUI(data);

        form.reset();
        addTodoBtn.classList.remove('d-none')
        updateTodoBtn.classList.add('d-none')
        state.editId = null;
    } catch (err) {
        snackbar(err.message, "error");
    } finally {
        handleSpinner(false);
    }
}

// updateUI()
function updateUI(data) {
    let li = document.getElementById(data.id);
    li.querySelector("strong").innerText = data.todoItem;
}

// deleteTodo()
async function deleteTodo(ele) {
    let result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
    })
    if (result.isConfirmed) {

        try {
            let removeId = ele.closest("li").id;
            let REMOVE_URL = `${BASE_URL}/todo1/${removeId}.json`;

            let data = await makeApiCall(REMOVE_URL, "DELETE");

            let getIndex = state.todo1.findIndex(ele => ele.id === removeId);
            state.todo1.splice(getIndex, 1);

            ele.closest("li").remove();

        } catch (err) {
            snackbar(err.message, "error");
        } finally {
            handleSpinner(false)
        }
    }


}
form.addEventListener("submit", onTodoAdd)
updateTodoBtn.addEventListener("click", onTodoUpdate)