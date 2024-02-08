// From: https://stackoverflow.com/a/65592593
// hacky but it works on code meant for the browser.
function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

class Question {
    no_answer = -1;
    question = "";
    difficulty = "";
    choices = [];
    answer = this.no_answer;

    set question(question) {
        this.question = question;
    }

    set difficulty(difficulty) {
        this.difficulty = difficulty;
    }


    set choices(choices) {
        this.choices = [];

        this.choices.push(...choices);
    }

    // TODO: randomize order
    get choices() {

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

class Quiz {
    questions = [];
    question_number = 0;
    score = 0;

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
            const choiceButtonInstance = choiceButtonTemplate.content.cloneNode(true);
            const button = choiceButtonInstance.querySelector("button");
            button.textContent = decodeHTMLEntities(choice);
            button.value = choice;
            button.addEventListener("click", answerHandler.bind(this, question));
    
            choicesSection.appendChild(choiceButtonInstance);
        }
    }
    
    displayQuestion(question) {
        const questionHeader = document.querySelector("#question");
        questionHeader.textContent = decodeHTMLEntities(question.question);
    }

    handleAnswer(question, event) {
        console.log(this);

        const choicesSection = document.querySelector("#choices-section");
        for (const button of choicesSection.children) {
            console.log(button.disabled);
            button.disabled = true;
        }

        if(this.check(question, event.target.value)) {
            event.target.classList.add("correct-choice");
            this.score += 10;
        } else {
            event.target.classList.add("wrong-choice");
        }
        
        setTimeout(() => {
            this.run();
        }, 1500);
    }
    
    askQuestion(question) {
        const questionNumberElement = document.querySelector("#question_number");
        questionNumberElement.textContent = this.question_number;

        const scoreElement = document.querySelector("#score");
        scoreElement.textContent = this.score;

        this.displayQuestion(question);
        this.displayChoices(question, this.handleAnswer);
    }

    run() {
        if(this.questions[this.question_number] === undefined) {
            this.fetchQuestions().then(() => {
                this.askQuestion(this.question().next().value);
            });
        } else {
            this.askQuestion(this.question().next().value);
        }
    }

    async fetchQuestions() {
        const response = await fetch("https://opentdb.com/api.php?amount=10&type=multiple");

        const questions = await response.json();
        console.log(questions);
        this.rawQuestionsToQuestions(questions.results);

        return this;
    }

    rawQuestionToQuestion(obj) {
        let question = new Question();
        question.question = obj.question;
        question.difficulty = obj.difficulty;

        // add choices
        question.choices.push(...obj.incorrect_answers);
        question.choices.push(obj.correct_answer);
        question.answer = obj.correct_answer;

        return question;
    }

    rawQuestionsToQuestions(rawQuestions) {        
        for (const rawQuestion of rawQuestions) {
            this.questions.push(this.rawQuestionToQuestion(rawQuestion));
        }
    }
}

const quiz = new Quiz();
quiz.run();