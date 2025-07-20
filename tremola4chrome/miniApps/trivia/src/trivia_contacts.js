const TriviaContacts = {
    show() {
        showContactSelection();
    }
};

function showContactSelection () {
    tremola.trivia.previousScenario = TriviaScenario;
    setTriviaScenario('trivia-contacts');
    populateContactsList();
}

function populateContactsList () {
    const container = document.getElementById('trivia_contacts_list');
    container.innerHTML = '';

    const alreadySelected = Array
        .from(document.querySelectorAll('#quiz_contacts_container .contact_pill'))
        .map(p => p.dataset.contactId);

    if (!window.tremola || !tremola.contacts) {
        container.innerHTML = '<p style="text-align:center;color:#666;">No contacts available.</p>';
        return;
    }

    for (const [id, entry] of Object.entries(tremola.contacts)) {
        const isChecked = alreadySelected.includes(id);

        const item = document.createElement('div');
        item.className = 'contact_item';
        item.innerHTML = `
            <input type="checkbox" id="contact_${id}" value="${id}" ${isChecked ? 'checked' : ''}>
            <label for="contact_${id}">${fid2display(id)}</label>
        `;
        container.appendChild(item);
    }
}

function confirmContactSelection () {
    const pillContainer = document.getElementById('quiz_contacts_container');
    pillContainer.querySelectorAll('.contact_pill').forEach(p => p.remove());

    document
        .querySelectorAll('#trivia_contacts_list input[type="checkbox"]:checked')
        .forEach(cb => {
            const id = cb.value;
            const name = fid2display(id);

            const pill = document.createElement('div');
            pill.className = 'contact_pill';
            pill.textContent = name;
            pill.dataset.contactId = id;

            const remove = document.createElement('span');
            remove.className = 'remove_contact';
            remove.innerHTML = '&times;';
            remove.onclick = () => pill.remove();

            pill.appendChild(remove);
            pillContainer.appendChild(pill);
        });

    setTriviaScenario(tremola.trivia.previousScenario || 'trivia-create');
}

function cancelContactSelection () {
    setTriviaScenario(tremola.trivia.previousScenario || 'trivia-create');
}
