let accordion_data = [];
let solvedCount = {};

const storedData = localStorage.getItem('accordionData');
if (storedData) {
    accordion_data = JSON.parse(storedData);
    setAccordion(accordion_data);
} else {
    fetch('https://test-data-gules.vercel.app/data.json')
        .then(response => response.json())
        .then(data => {
            accordion_data = data.data;
            localStorage.setItem('accordionData', JSON.stringify(accordion_data));
            setAccordion(accordion_data);
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Search
document.getElementById('searchinput').addEventListener('input', () => {
    setAccordion(accordion_data);
});

//vertical view (default)
document.getElementById('toggle_vertical').addEventListener('click', () => {
    const container = document.getElementById('accordion-container');
    container.classList.remove('grid-view');
});

// toggle gridview
document.getElementById('grid_view').addEventListener('click', () => {
    const container = document.getElementById('accordion-container');
    container.classList.add('grid-view');
});

//Function is triggered on checkbox change or delete;
function updateSolvedQuestionsCount(item) {
    const count = item.ques.reduce((count, q) => q.checked ? count + 1 : count, 0);
    solvedCount[item.title] = count;
    const accordion = Array.from(document.querySelectorAll('.accordion')).find(acc => acc.querySelector('h3').textContent === item.title);
    if (accordion) {
        accordion.querySelector('p').textContent = `${solvedCount[item.title]} Solved | ${item.ques.length} Problems`;
        const progress = (count / item.ques.length) * 100;
        accordion.style.setProperty('--progress-percentage', `${progress}%`);
    }
}

// Setup accordion with questions
function setAccordion(data) {
    const container = document.getElementById('accordion-container');
    const search = document.getElementById('searchinput').value.toLowerCase();
    container.innerHTML = '';

    const filtered_data = data.map(item => {
        const filtered_questions = item.ques.filter(q => q.title && q.title.toLowerCase().includes(search));
        if (filtered_questions.length > 0) {
            return {...item, ques: filtered_questions };
        }
        else
        return null;
    }).filter(item => item !== null);

    filtered_data.forEach(item => {
        solvedCount[item.title] = item.ques.reduce((count, q) => q.checked ? count + 1 : count, 0);

        const accordion = document.createElement('button');
        accordion.className = 'accordion';
        accordion.innerHTML = `<h3>${item.title}</h3>
                               <p>${solvedCount[item.title]} Solved | ${item.ques.length} Problems</p>`;

        const accordionContent = document.createElement('div');
        accordionContent.className = 'accordion_content';
        populateQuestions(item, accordionContent);
        
        const progressPercentage = (solvedCount[item.title] / item.ques.length) * 100;
        accordion.style.setProperty('--progress-percentage', `${progressPercentage}%`);

        container.appendChild(accordion);
        container.appendChild(accordionContent);

        accordion.addEventListener('click', function () {
            const isGridView = document.getElementById('accordion-container').classList.contains('grid-view');
            if(isGridView)
            {
                event.stopPropagation();
                return;
            }
            else{
                accordionContent.style.display = (accordionContent.style.display === 'block') ? 'none' : 'block';
                accordion.style.background = (accordionContent.style.display === 'block') ? 'rgb(20, 103, 226)' : 'white';
                accordion.style.color = (accordionContent.style.display === 'block') ? 'white' : 'rgb(20, 103, 226)';
            }
        });
    });
    localStorage.setItem('accordionData', JSON.stringify(accordion_data));
}

// Populate questions inside accordion
function populateQuestions(item, accordionContent, limit = 10) {
    accordionContent.innerHTML = '';
    const questionsToShow = item.ques.slice(0, limit);
    const additionalQuestions = item.ques.length - questionsToShow.length;

    questionsToShow.forEach(q => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question_card';

        questionDiv.innerHTML = `
            <div class="question_box">
                <h3>${q.title}</h3>
                <div class="tags">${q.tags}</div>
                <a href="${q.yt_link}" target="_blank">Watch on YouTube</a>
                <a href="${q.p1_link}" target="_blank">Problem ${q.p2_link ? 1 : ''}</a>
                ${q.p2_link ? `<a href="${q.p2_link}" target="_blank">Problem 2</a>` : ''}
            </div>
            <div style="width:80px; display:flex; gap:15px ; align-items:top">
                <input type="checkbox" style="width:20px; height:20px" ${q.checked ? 'checked' : ''}/>
                <i class="bx bx-trash" style="cursor:pointer"></i>
                <i class='bx bx-bookmark'  style="cursor:pointer"></i>
            </div>`;

        if (q.checked) {
            questionDiv.style.backgroundColor = '#64E764';
        }

        const checkbox = questionDiv.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function () {
            q.checked = this.checked;
            updateSolvedQuestionsCount(item);
            questionDiv.style.backgroundColor = this.checked ? '#64E764' : 'white';

            const accordionData = JSON.parse(localStorage.getItem('accordionData'));
            const index = accordionData.findIndex(i => i.title === item.title);
            if (index !== -1) {
                const questionIndex = accordionData[index].ques.findIndex(ques => ques.title === q.title);
                if (questionIndex !== -1) {
                    accordionData[index].ques[questionIndex].checked = this.checked;
                    localStorage.setItem('accordionData', JSON.stringify(accordionData));
                }
            }
        });

        const deleteIcon = questionDiv.querySelector('.bx-trash');
        deleteIcon.addEventListener('click', function () {
            const questionIndex = item.ques.findIndex(ques => ques.title === q.title);
            if (questionIndex !== -1) {
                item.ques.splice(questionIndex, 1);
                populateQuestions(item, accordionContent, limit);
                updateSolvedQuestionsCount(item);

                const accordionData = JSON.parse(localStorage.getItem('accordionData'));
                const index = accordionData.findIndex(i => i.title === item.title);
                if (index !== -1) {
                    accordionData[index].ques = item.ques;
                    localStorage.setItem('accordionData', JSON.stringify(accordionData));
                }
            }
        });

        accordionContent.appendChild(questionDiv);
    });

    if (additionalQuestions > 0 && limit === 10) {
        const showMoreButton = document.createElement('button');
        showMoreButton.textContent = `Show ${additionalQuestions} more`;
        showMoreButton.className = 'show-more';

        showMoreButton.addEventListener('click', () => {
            populateQuestions(item, accordionContent, item.ques.length);
            showMoreButton.style.display = 'none';
        });

        accordionContent.appendChild(showMoreButton);
    }
}

