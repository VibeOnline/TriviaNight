// Get the team template
let temp_team = document.querySelector("#teamTemplate");
const TEAM_TEMPLATE = temp_team.cloneNode(true);
temp_team.parentNode.removeChild(temp_team);
delete temp_team;

// Get the round template
let temp_round = document.querySelector("#roundTemplate");
const ROUND_TEMPLATE = temp_round.cloneNode(true);
temp_round.parentNode.removeChild(temp_round);
delete temp_round;

// Window messages
let popout_win;
function send_screen(type, data) {
    popout_win.postMessage({
        "type": type,
        "data": data
    }, "*");
}

// Custom prompts
function custom_prompt(message, callback, input_type="text") { // Input prompt
    let prompt = document.querySelector("#prompt");

    // Show
    prompt.removeAttribute("hidden");

    // Modify prompt
    prompt.querySelector(".modal-title").innerHTML = message;

    if (input_type == "textarea") {
        prompt.querySelector(".modal-content").innerHTML = `<textarea placeholder="Enter text..." class="inp" style="width: calc(100% - 10px); max-height: 80vh; resize: vertical;"></textarea>`;
    } else {
        prompt.querySelector(".modal-content").innerHTML = `<input type="${input_type}" placeholder="Enter ${input_type}..." class="inp" style="width: calc(100% - 10px);">`;
    }

    // Track input
    let inp = prompt.querySelector(".modal-content > .inp");
    inp.focus();
    inp.addEventListener("keydown", (e) => {
        if (e.key == "Enter") {
            prompt.setAttribute("hidden", "");

            callback(inp.value);
        }
    });

    // Set onclick to callback
    prompt.querySelector(".modal-confirm").onclick = () => {
        prompt.setAttribute("hidden", "");

        callback(inp.value);
    }
}

function custom_confirm(message, callback) { // Yes or no prompt
    let prompt = document.querySelector("#confirm");

    // Show
    prompt.removeAttribute("hidden");

    // Modify prompt
    prompt.querySelector(".modal-title").innerHTML = message;

    // Set onclick to callback
    prompt.querySelector(".modal-confirm").onclick = () => {
        prompt.setAttribute("hidden", "");

        callback();
    }
}

function custom_alert(message) { // Alert text
    let alert_text = document.querySelector("#alert");

    // Set message
    alert_text.querySelector(".modal-title").innerHTML = message;
}

function custom_list(message, list, callback, action_txt) { // Alert text
    let alert_list = document.querySelector("#list");

    // Show
    alert_list.removeAttribute("hidden");

    // Set contents
    alert_list.querySelector(".modal-title").innerHTML = message;
    let ls = alert_list.querySelector("table tbody");
    ls.innerHTML = "";

    if (callback) {
        list.forEach((item, ind) => {
            ls.innerHTML += `<tr><td>${item}</td><td id="question-${ind}" class="modal_list_action"><button class="btn btn-add">${action_txt}</button></td></tr>`;

            ls.querySelector(`#question-${ind}`).onclick = () => callback(item);
        });
    } else {
        list.forEach(item => {
            ls.innerHTML += `<tr><td>${item}</td></tr>`;
        });
    }
}

// Calculate teams score for a round when changed
function calculate_score(round_name, team_name) {
    team_name = team_name.replaceAll(" ", "-");

    let team_answers = document.querySelectorAll(`#round-${round_name} #team-${team_name} input`);

    // Check answers
    let team_score = Number(document.querySelector(`#round-${round_name} #team-${team_name} .team_manual_score input`).value);
    if (isNaN(team_score)) team_score = 0;

    for (i = 0; i < team_answers.length; i++) {
        if (team_answers[i].checked) {
            team_score += Number(document.querySelector(`#round-${round_name} thead .${team_answers[i].classList[0]}`).value);
        }
    }
    
    // Display score
    document.querySelector(`#round-${round_name} #team-${team_name} .team_score`).innerHTML = team_score;
}

// Add team to round
function add_team(round_name) {
    custom_prompt("Enter team name", team_name => {
        team_name = team_name.replaceAll(" ", "-")

        // Check if team exists in round
        if (document.querySelector(`#round-${round_name} #team-${team_name}`) == null) {
            let this_team = TEAM_TEMPLATE.cloneNode(true);

            // Modify contents
            this_team.querySelector(".team_name").innerHTML = team_name.replaceAll("-", " ").replaceAll("<", "&lt;");
            this_team.setAttribute("id", `team-${team_name}`);

            // Add functions
            this_team.querySelector(".delete_team").addEventListener("click", () => {
                custom_confirm(`Are you sure you want to delete team "${team_name}"? This CANNOT be undone`, () => this_team.remove());
            });

            // Add existing questions
            for (i = 0; i < roundQuestions[round_name].length; i++) {
                let answer_column = document.createElement("td");
                answer_column.innerHTML = `<input type="checkbox" class="Q${i + 1}-pnts">`;

                this_team.insertBefore(answer_column, this_team.querySelector(".team_score"));

                // Listen for changes
                answer_column.querySelector("input").addEventListener("change", () => calculate_score(round_name, team_name));
            }

            // Connect manual score
            this_team.querySelector(".team_manual_score").addEventListener("change", () => calculate_score(round_name, team_name));

            // Insert to round
            document.querySelector(`#round-${round_name} tbody`).appendChild(this_team);
        } else {
            custom_alert(`Team "${team_name}" already exists in "${round_name}"`);
        }
    });
}

// Keep track of questions per round
const roundQuestions = {};
function add_question(round_name, question_worth) {
    if (!question_worth) {
        custom_prompt("How much is this question worth? (ex. 1, 1.0, 1.5)", question_worth => {
            if (isNaN(question_worth)) {
                custom_alert(`"${question_worth}" is not a valid number`);
            } else {
                custom_prompt("New question", question => {
                    roundQuestions[round_name].push(question);
        
                    // Create head
                    let header_column = document.createElement(`th`);
                    header_column.innerHTML = `Q${roundQuestions[round_name].length} <input value="${question_worth}" class="Q${roundQuestions[round_name].length}-pnts" type="number">pts`;
                    header_column.querySelector("input").addEventListener("change", () => {
                        let team_rows = document.querySelectorAll(`#round-${round_name} tbody tr`);
        
                        for (i = 0; i < team_rows.length; i++) {
                            let team_name = team_rows[i].querySelector(".team_name").innerHTML;
        
                            calculate_score(round_name, team_name);
                        }
                    });
        
                    // Create team answer input
                    let answer_column = document.createElement(`td`);
                    answer_column.innerHTML = `<input type='checkbox' class="Q${roundQuestions[round_name].length}-pnts">`;
        
                    // Add to all existing teams
                    let team_rows = document.querySelectorAll(`#round-${round_name} tbody tr`);
                    for (i = 0; i < team_rows.length; i++) {
                        let answer_clone = answer_column.cloneNode(true);
                        team_rows[i].insertBefore(answer_clone, team_rows[i].querySelector(".team_score"));
        
                        // Listen for changes
                        let team_name = team_rows[i].querySelector(".team_name").innerHTML;
                        answer_clone.querySelector("input").addEventListener("change", () => calculate_score(round_name, team_name));
                    }
                    delete answer_column;
        
                    // Get and insert into header
                    let header_row = document.querySelector(`#round-${round_name} thead tr`);
                    header_row.insertBefore(header_column, header_row.querySelector(".team_score"));
                }, "textarea");
            }
        }, "number");
    }
}

// List questions for a round
function show_questions(round_name) {
    custom_list(`${round_name} Questions`, roundQuestions[round_name], text => {
        send_screen("text", text);
    }, "Send Question", `${round_name}-`);
}

// List total scores
function send_scores() {
    let scores = {};

    // Build team to score list
    document.querySelectorAll("#roundContainer .round-table tbody tr").forEach(team => {
        let team_name = team.querySelector(".team_name").innerHTML;

        if (!scores[team_name]) scores[team_name] = 0;
        
        scores[team_name] += Number(team.querySelector(".team_score").innerHTML);
    });

    // Build them into list
    let list = [];
    for (team in scores) {
        list.push({ "name": team, "score": scores[team] });
    }

    list.sort((a, b) => {
        return a["score"] - b["score"];
    });

    // Send list to big screen
    send_screen("scores", list.reverse());
}

// Delete round you didn't mean to make
function delete_round(round_name) {
    custom_confirm(`Are you sure you want to delete round "${round_name}"? This CANNOT be undone`, () => document.querySelector(`#round-${round_name}`).remove());
}

// Add a new round
function add_round() {
    custom_prompt("Enter round name", round_name => {
        round_name = round_name.replaceAll(" ", "-");

        // Check if round exists
        if (document.querySelector(`#round-${round_name}`) == null) {
            let this_round = ROUND_TEMPLATE.cloneNode(true);
    
            // Modify contents
            this_round.querySelector(".round_name").innerHTML = round_name.replaceAll("-", " ").replaceAll("<", "&lt;");
            this_round.setAttribute("id", `round-${round_name}`);
    
            // Add functions
            this_round.querySelector(".add_team").addEventListener("click", () => add_team(round_name));
            this_round.querySelector(".add_question").addEventListener("click", () => add_question(round_name));
            this_round.querySelector(".delete_round").addEventListener("click", () => delete_round(round_name));
            this_round.querySelector(".show_questions").addEventListener("click", () => show_questions(round_name));
    
            // Setup questions
            roundQuestions[round_name] = [];
    
            // Insert to page
            document.querySelector("#roundContainer").appendChild(this_round);
    
            // Add default questions
            let question_count = Number(document.querySelector("#default-questions").value);
            if (!isNaN(question_count)) {
                for (j = 0; j < question_count; j++) {
                    add_question(round_name, 1);
                }
            }
        } else {
            custom_alert(`Round "${round_name}" already exists`);
        }
    });
}

// Display related functions
function open_tracker() {
    popout_win = window.open("popup.html", "Trivia Night Display", "height=500,width=800");
}