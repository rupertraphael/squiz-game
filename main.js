// From: https://stackoverflow.com/a/65592593
// hacky but it works on code meant for the browser.
function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

class Question {
    static easy = 'easy';
    static medium = 'medium';
    static hard = 'hard';
    no_answer = -1;
    question = "";
    difficulty = "";
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

class Quiz {
    questions = [];
    question_number = 0;
    questions_difficulty = Question.easy;
    score = 0;
    difficulty_streak = 0;

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
        const questionDifficulty = document.querySelector("#question-difficulty");
        questionHeader.textContent = decodeHTMLEntities(question.question);
        questionDifficulty.textContent = decodeHTMLEntities(question.difficulty);
    }

    addScore() {
        this.score += 10;
    }

    handleAnswer(question, event) {
        const choicesSection = document.querySelector("#choices-section");
        for (const button of choicesSection.children) {
            if(this.check(question, button.value)) {
                button.classList.add("correct-choice");
            }
        }

        if(this.check(question, event.target.value)) {
            event.target.classList.add("correct-choice");
            this.addScore();
            this.difficulty_streak++;
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

const quiz = new Quiz();
document.addEventListener("DOMContentLoaded", (event) => {
    quiz.fetchQuestions().then(() => {
        quiz.nextQuestion();
    });    
});