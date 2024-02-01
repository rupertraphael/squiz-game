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
quiz.fetchQuestions().then(quiz => {
    // populate choices dom
    const choiceButtonTemplate = document.querySelector("#choice-button-template");
    const choicesSection = document.querySelector("#choices-section");
    const questionHeader = document.querySelector("#question");

    currentQuestion = quiz.question().next().value;

    questionHeader.textContent = currentQuestion.question;

    for (const choice of currentQuestion.choices) {
        const choiceButtonInstance = choiceButtonTemplate.content.cloneNode(true);
        choiceButtonInstance.querySelector("button").textContent = choice;

        choicesSection.appendChild(choiceButtonInstance);
    }
});