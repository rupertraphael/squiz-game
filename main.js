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


    async fetch() {
        const response = await fetch("https://opentdb.com/api.php?amount=10&type=multiple");

        const questions = await response.json();
        console.log(questions);
        this.rawQuestionsToQuestions(questions.results);
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
        let questions = [];
        
        for (const rawQuestion of rawQuestions) {
            questions.push(this.rawQuestionToQuestion(rawQuestion));
        }

        console.log(questions);
    }
}

let quiz = new Quiz();
quiz.fetch();