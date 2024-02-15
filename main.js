// From: https://stackoverflow.com/a/65592593
// hacky but it works on code meant for the browser.
function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

function defaultCallback(customElementID) {
    let template = document.getElementById(customElementID);
    let templateContent = template.content;

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(templateContent.cloneNode(true));
}

customElements.define(
    "choice-button",
    class extends HTMLElement {
        static get observedAttributes() {
            return ["is-correct", "disabled"];
        }

        constructor() {
            super();
        }

        connectedCallback() {
            defaultCallback.call(this, "choice-button-template");
        }

        attributeChangedCallback(name, oldValue, newValue) {
            const button = this.shadowRoot.querySelector("button");

            if(name === "disabled") {
                button.setAttribute("disabled", "");
            } else if(name === "is-correct") {
                console.log(this.value);
                console.log(newValue);

                if(newValue == "false") {
                    button.classList.remove("correct-choice");
                    button.classList.add("wrong-choice");
                } else {
                    button.classList.remove("wrong-choice");
                    button.classList.add("correct-choice");
                }
            }
        }
    },
  );

class Question {
    static easy = 'easy';
    static medium = 'medium';
    static hard = 'hard';
    no_answer = -1;
    question = "";
    difficulty = "none";
    _choices = [];
    answer = this.no_answer;

    set question(question) {
        this.question = question;
    }

    set difficulty(difficulty) {
        this.difficulty = difficulty;
    }

    addChoice(choice) {
        this._choices.push(choice);
    }

    set choices(choices) {
        this._choices = [];
        this._choices.push(...choices);
    }
    get choices() {
        // from: https://stackoverflow.com/a/46545530
        return (this._choices
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value));
    }

    set answer(answer) {
        this.answer = answer;
    }

    check(answer) {
        if(this.answer === this.no_answer) {
            throw `Answer has not been set.`;
        }

        return answer === this.answer;
    }

}

class User {
    score = 0;

    addToScore(question) {
        this.score += 10;

        const scoreElement = document.querySelector("#score");
        scoreElement.textContent = this.score;
        
        this.addToHistory(question);
    }

    addToHistory(question) {
        const itemTemplate = document.querySelector("#score-history-list-item");
        const list = document.querySelector("#score-history-list");
        const itemInstance = itemTemplate.content.cloneNode(true);

        const listItem = itemInstance.querySelector("li");
        const label = listItem.querySelector('label'); 
        const score = listItem.querySelector('span');
        label.textContent = decodeHTMLEntities(question.question);
        score.textContent = "+10";
        list.appendChild(listItem);
    }
}

class Quiz {
    questions = [];
    question_number = 0;
    questions_difficulty = Question.easy;
    score = 0;
    difficulty_streak = 0;
    user = null;

    constructor(user) {
        this.user = user;
    }

    get questions() {
        return this.questions;
    }

    * question() {
        yield this.questions[this.question_number++];
    }

    check(question, answer) {
        return question.check(answer);
    }

    displayChoices(question, answerHandler) {
        const choiceButtonTemplate = document.querySelector("#choice-button-template");
        const choicesSection = document.querySelector("#choices-section");
    
        while(choicesSection.hasChildNodes()) {
            choicesSection.removeChild(choicesSection.firstChild);
        }
    
        for (const choice of question.choices) {
            const button = document.createElement("choice-button");
            button.textContent = decodeHTMLEntities(choice);
            button.value = choice;
            button.addEventListener("click", answerHandler.bind(this, question));            
    
            choicesSection.appendChild(button);
        }
    }
    
    displayQuestion(question) {
        const questionHeader = document.querySelector("#question");
        const questionDifficulty = document.querySelector("#question-difficulty");
        questionHeader.textContent = decodeHTMLEntities(question.question);
        questionDifficulty.textContent = decodeHTMLEntities(question.difficulty);
    }

    addToScore(question) {
        this.user.addToScore(question);
    }

    handleAnswer(question, event) {
        const choicesSection = document.querySelector("#choices-section");
        for (const button of choicesSection.children) {
            button.setAttribute("disabled", "");

            if(this.check(question, button.value)) {
                button.setAttribute("is-correct", true);
            }
        }

        if(this.check(question, event.target.value)) {
            event.target.setAttribute("is-correct", true);
            this.addToScore(question);
            this.difficulty_streak++;
        } else {
            event.target.setAttribute("is-correct", false);
        }
        
        setTimeout(() => {
            this.run();
        }, 1500);
    }
    
    askQuestion(question) {
        const questionNumberElement = document.querySelector("#question_number");
        questionNumberElement.textContent = this.question_number;

        this.displayQuestion(question);
        this.displayChoices(question, this.handleAnswer);
    }

    nextQuestion() {
        this.askQuestion(this.question().next().value);
    }

    run() {
        if(this.questions[this.question_number] === undefined) {
            if(this.difficulty_streak > 3) {
                this.questions_difficulty = Question.hard;
            } else if (this.difficulty_streak > 1) {
                this.questions_difficulty = Question.medium;
            } else {
                this.questions_difficulty = Question.easy;
            }
            console.log(this.questions_difficulty);
            this.difficulty_streak = 0;
            this.fetchQuestions().then(() => {
                this.nextQuestion();
            });
        } else {
            this.nextQuestion();
        }
    }

    showError() {

    }

    async fetchQuestions() {
        const amount = 5;
        const response = await fetch(`https://opentdb.com/api.php?amount=${amount}&type=multiple&difficulty=${this.questions_difficulty}`);

        const questions = await response.json();
        this.rawQuestionsToQuestions(questions.results);

        console.log(this.questions);

        return this;
    }

    rawQuestionToQuestion(obj) {
        let question = new Question();
        question.question = obj.question;
        question.difficulty = obj.difficulty;

        // add choices
        question.choices = obj.incorrect_answers;
        question.addChoice(obj.correct_answer);
        question.answer = obj.correct_answer;

        return question;
    }

    rawQuestionsToQuestions(rawQuestions) {        
        for (const rawQuestion of rawQuestions) {
            this.questions.push(this.rawQuestionToQuestion(rawQuestion));
        }
    }
}

const quiz = new Quiz(new User());

const initialLoad = function (event){
    quiz.fetchQuestions().then(
        () => {
            quiz.nextQuestion();
        }, 
        () => {
            setTimeout(initialLoad, 5000);
        }
    )
};

document.addEventListener("DOMContentLoaded", initialLoad);