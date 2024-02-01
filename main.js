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

    get questions() {
        return this.questions;
    }

    * question() {
        yield this.questions[this.question_number++];
    }

    check(question, answer) {
        question.check(answer);
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

function handleAnswer(e) {
    answer = e.target.value;
    this.check(answer);

    runQuiz(quiz);
}

function displayChoices(question) {
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
        button.addEventListener("click", handleAnswer.bind(question));

        choicesSection.appendChild(choiceButtonInstance);
    }
}

function displayQuestion(question) {
    const questionHeader = document.querySelector("#question");
    questionHeader.textContent = decodeHTMLEntities(question.question);
}

function askQuestion(question) {
    displayQuestion(question);
    displayChoices(question);
}

function runQuiz(quiz) {
    askQuestion(quiz.question().next().value);
}

quiz.fetchQuestions().then(quiz => {
    runQuiz(quiz);
});