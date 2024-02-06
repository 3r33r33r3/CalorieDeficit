document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const calculateBtn = document.getElementById('calculate-btn');
    const bmiResult = document.getElementById('bmi-result');
    const maintainCaloriesResult = document.getElementById('maintain-calories-result');
    const deficitCaloriesResult = document.getElementById('deficit-calories-result');
    const downloadMenuBtn = document.getElementById('download-menu-btn');

    // Event listeners
    calculateBtn.addEventListener('click', calculateCalories);
    downloadMenuBtn.addEventListener('click', downloadMenu);

    // Function to calculate BMI and calories
    function calculateCalories() {
        const height = parseInt(document.getElementById('height').value);
        const weight = parseInt(document.getElementById('weight').value);
        const age = parseInt(document.getElementById('age').value);
        const sex = document.getElementById('sex').value;

        // BMI Calculation
        const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
        bmiResult.textContent = bmi;

        // Calorie Calculation (using Mifflin-St Jeor Equation)
        const bmr = sex === 'male' 
                    ? (10 * weight) + (6.25 * height) - (5 * age) + 5 
                    : (10 * weight) + (6.25 * height) - (5 * age) - 161;
        const maintenanceCalories = bmr * 1.2; // assuming sedentary activity level
        const deficitCalories = maintenanceCalories - 500; // creating a deficit of 500 calories per day for weight loss

        maintainCaloriesResult.textContent = Math.round(maintenanceCalories);
        deficitCaloriesResult.textContent = Math.round(deficitCalories);

        // Fetch recipes based on calorie needs 
        fetchRecipes(Math.round(deficitCalories));

        document.getElementById('results').style.display = 'block';
        document.getElementById('recipes').style.display = 'block';
        document.getElementById('download-menu-btn').style.display = 'block';
    }

    // Fetch recipes from Spoonacular API
    function fetchRecipes(calories) {
        // Assuming you have a proxy server to append your API key for Spoonacular
        const apiUrl = `https://api.spoonacular.com/mealplanner/generate?timeFrame=week&targetCalories=${calories}&apiKey=cc021d9db1e3416baaf2a7cbe191cb62`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                displayRecipes(data);
            })
            .catch(error => {
                console.error('Error fetching recipes:', error);
            });
    }
});

function openDay(evt, dayName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(dayName).style.display = "block";
    evt.currentTarget.className += " active";
}

function displayRecipes(weekData) {
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    weekDays.forEach((day, index) => {
        const dayData = weekData.week[day];
        const dayTabContent = document.getElementById(`Day${index + 1}`);
        dayTabContent.innerHTML = ''; // Clear previous content

        // Creating a div for each meal
        dayData.meals.forEach(meal => {
            const mealDiv = document.createElement('div');
            mealDiv.classList.add('meal');

            // Add meal title
            const mealTitle = document.createElement('h4');
            mealTitle.textContent = meal.title;
            mealDiv.appendChild(mealTitle);

            // Add meal image
            const mealImage = document.createElement('img');
            mealImage.src = `https://spoonacular.com/recipeImages/${meal.id}-312x231.${meal.imageType}`;
            mealImage.alt = meal.title;
            mealDiv.appendChild(mealImage);

            // Add meal preparation time and servings
            const mealDetails = document.createElement('p');
            mealDetails.textContent = `Ready in ${meal.readyInMinutes} minutes, serves ${meal.servings}.`;
            mealDiv.appendChild(mealDetails);

            // Add a link to the recipe source
            const mealLink = document.createElement('a');
            mealLink.href = meal.sourceUrl;
            mealLink.textContent = 'View Recipe';
            mealLink.target = '_blank'; // Open in new tab
            mealDiv.appendChild(mealLink);
            
            const detailsDiv = document.createElement('div');

            // Add button to show/hide the meal details
            const detailsButton = document.createElement('button');
            detailsButton.textContent = 'Show Details';
            detailsButton.classList.add('details-btn');
            detailsButton.onclick = () => toggleMealDetails(meal.id, mealDiv);
            detailsDiv.appendChild(detailsButton);

            // Add container for meal details (ingredients and instructions)
            const mealDetailsContainer = document.createElement('div');
            mealDetailsContainer.id = `details-${meal.id}`;
            mealDetailsContainer.classList.add('meal-details');
            mealDetailsContainer.style.display = 'none'; // Hidden by default
            detailsDiv.appendChild(mealDetailsContainer);

            mealDiv.appendChild(detailsDiv);            

            dayTabContent.appendChild(mealDiv);
        });

        // Display total nutrients
        const nutrientInfo = document.createElement('p');
        nutrientInfo.innerHTML = `
            <strong>Total Nutrients:</strong><br>
            Calories: ${dayData.nutrients.calories.toFixed(2)}<br>
            Protein: ${dayData.nutrients.protein.toFixed(2)}g<br>
            Fat: ${dayData.nutrients.fat.toFixed(2)}g<br>
            Carbohydrates: ${dayData.nutrients.carbohydrates.toFixed(2)}g
        `;
        dayTabContent.appendChild(nutrientInfo);
    });
}

// Function to toggle meal details
function toggleMealDetails(mealId, mealDiv) {
    const detailsContainer = mealDiv.querySelector(`#details-${mealId}`);
    const isVisible = detailsContainer.style.display === 'block';

    if (isVisible) {
        detailsContainer.style.display = 'none';
    } else {
        if (!detailsContainer.hasChildNodes()) {
            fetchMealDetails(mealId, detailsContainer);
        }
        detailsContainer.style.display = 'block';
    }
}

function fetchMealDetails(mealId, detailsContainer) {
    const apiUrl = `https://api.spoonacular.com/recipes/${mealId}/information?includeNutrition=false&apiKey=cc021d9db1e3416baaf2a7cbe191cb62`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Create and append the header for ingredients
            const ingredientsHeader = document.createElement('h3');
            ingredientsHeader.textContent = 'Ingredients';
            detailsContainer.appendChild(ingredientsHeader);

            // Create and append the ingredients list
            const ingredientsList = document.createElement('ul');
            data.extendedIngredients.forEach(ingredient => {
                const ingredientItem = document.createElement('li');
                ingredientItem.textContent = `${ingredient.original}`;
                ingredientsList.appendChild(ingredientItem);
            });
            detailsContainer.appendChild(ingredientsList);

            // Create and append the header for the recipe
            const recipeHeader = document.createElement('h3');
            recipeHeader.textContent = 'Recipe';
            detailsContainer.appendChild(recipeHeader);

            // Create and append the ordered list for the recipe instructions
            const instructionsList = document.createElement('ol');
            let cleanedInstructions = data.instructions.replace(/<\/?li>|<\/?ol>|<\/?p>/g, '').replace(/\n/g, '').replace(/\d+\.\s/g, '');
            const steps = cleanedInstructions.split('.').filter(step => step.trim() !== '' && step.trim().length > 2); // Split by period and filter out empty/short strings
            steps.forEach(step => {
                const stepItem = document.createElement('li');
                stepItem.textContent = step.trim() + '.'; // Add the period back to each step
                instructionsList.appendChild(stepItem);
            });
            detailsContainer.appendChild(instructionsList);
        })
        .catch(error => {
            console.error('Error fetching meal details:', error);
        });
}


async function downloadMenu() {
    // Fetch the bulk recipe information
    const mealIds = getMealIdsFromDOM();
    const apiKey = 'cc021d9db1e3416baaf2a7cbe191cb62'; // Replace with your actual API key
    const apiUrl = `https://api.spoonacular.com/recipes/informationBulk?ids=${mealIds.join(',')}&apiKey=${apiKey}`;

    try {
        const response = await fetch(apiUrl);
        const mealsData = await response.json();

        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPos = 10; // Initial vertical position

        mealsData.forEach((meal, index) => {
            // Add a new page for each recipe (except the first one)
            if (index > 0) {
                doc.addPage();
            }
        
            const title = meal.title;
            const ingredients = meal.extendedIngredients.map(ing => `• ${ing.original}`).join('\n');
            const cleanedInstructions = meal.instructions.replace(/<\/?li>|<\/?ol>|<\/?p>/g, '').replace(/\n/g, '').replace(/\d+\.\s/g, '');
            const steps = cleanedInstructions.split('.').filter(step => step.trim() !== '' && step.trim().length > 2); // Split by period and filter out empty/short strings
            const formattedSteps = steps.map((step, index) => `${index + 1}. ${step.trim()}`).join('\n'); // Add numbering to each step
        
            let yPos = 10; // Reset yPos for each new page
        
            // Add meal title
            doc.setFontSize(16);
            doc.text(title, 10, yPos);
            yPos += 10;
        
            // Add ingredients header
            doc.setFontSize(14);
            doc.text('Ingredients', 10, yPos);
            yPos += 10;
        
            // Add ingredients list
            doc.setFontSize(10);
            const ingredientsLines = doc.splitTextToSize(ingredients, 180);
            ingredientsLines.forEach(line => {
                doc.text(line, 10, yPos);
                yPos += 7;
                // Check for page overflow and add a new page if needed
                if (yPos >= 280) {
                    doc.addPage();
                    yPos = 10;
                }
            });
        
            yPos += 10; // Extra space before instructions
        
            // Add instructions header
            doc.setFontSize(14);
            doc.text('Instructions', 10, yPos);
            yPos += 10;
        
            // Add instructions list
            const instructionsLines = doc.splitTextToSize(formattedSteps, 180);
            doc.setFontSize(10);
            instructionsLines.forEach(line => {
                doc.text(line, 10, yPos);
                yPos += 7;
                // Check for page overflow and add a new page if needed
                if (yPos >= 280) {
                    doc.addPage();
                    yPos = 10;
                }
            });
        
            yPos += 10; // Extra space at the end of the recipe
        });        
        // Save the PDF
        doc.save('weekly_menu.pdf');
    } catch (error) {
        console.error('Error fetching meal details:', error);
    }
}

// Function to extract meal IDs from the DOM
function getMealIdsFromDOM() {
    const detailsContainers = document.querySelectorAll('.meal-details');
    return Array.from(detailsContainers).map(container => container.id.split('-')[1]);
}
