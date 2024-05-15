document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('grid-container');
  const colorPicker = document.getElementById('color-picker');
  const xInput = document.getElementById('x-input');
  const yInput = document.getElementById('y-input');
  const setButton = document.getElementById('set-button');
  const settingsButton = document.getElementById('settings-button');
  const addFrameButton = document.getElementById('add-frame-button');
  const dropdownMenu = document.getElementById('dropdown-menu');
  const frameMenu = document.getElementById('frame-menu');
  const newFrameButton = document.getElementById('new-frame-button');
  const duplicateFrameButton = document.getElementById('duplicate-frame-button');
  const outputButton = document.getElementById('output-button');
  const frameButtonsContainer = document.getElementById('frame-buttons');

  let frames = [];
  let gridWidth = 9;
  let gridHeight = 9;
  let currentFrameIndex = -1;
  let frameCounter = 0;

  function createGrid(x, y, frameData = null) {
      gridContainer.innerHTML = '';
      gridContainer.style.gridTemplateColumns = `repeat(${x}, 50px)`;

      for (let i = 0; i < x * y; i++) {
          const gridItem = document.createElement('div');
          gridItem.classList.add('grid-item');
          gridItem.dataset.index = i;
          if (frameData) {
              gridItem.style.backgroundColor = frameData[i];
          }
          gridItem.addEventListener('click', () => {
              gridItem.style.backgroundColor = colorPicker.value;
          });
          gridContainer.appendChild(gridItem);
      }
  }

  function saveCurrentFrame() {
      if (currentFrameIndex !== -1) {
          const gridItems = document.querySelectorAll('.grid-item');
          const frameData = Array.from(gridItems).map(item => window.getComputedStyle(item).backgroundColor);
          frames[currentFrameIndex] = frameData;
      }
  }

  function loadFrame(index) {
      currentFrameIndex = index;
      createGrid(gridWidth, gridHeight, frames[index]);
  }

  function addFrameButtonToUI(index) {
      frameCounter++;
      const button = document.createElement('button');
      button.textContent = `Frame ${frameCounter}`;
      button.classList.add('frame-button');
      button.addEventListener('click', () => {
          saveCurrentFrame();
          loadFrame(index);
      });
      frameButtonsContainer.appendChild(button);
  }

  function initializeGrid() {
      frames = [];
      currentFrameIndex = -1;
      frameCounter = 0;
      createGrid(gridWidth, gridHeight, new Array(gridWidth * gridHeight).fill('rgb(0, 0, 0)'));
  }

  function addFrameToUI() {
      saveCurrentFrame();
      frames.push(new Array(gridWidth * gridHeight).fill('rgb(0, 0, 0)'));
      addFrameButtonToUI(frames.length - 1);
      loadFrame(frames.length - 1);
  }

  function duplicateFrame() {
      if (currentFrameIndex !== -1) {
          saveCurrentFrame();
          const newFrameData = [...frames[currentFrameIndex]];
          frames.push(newFrameData);
          addFrameButtonToUI(frames.length - 1);
          loadFrame(frames.length - 1);
      }
  }

  function rgbStringToArray(rgbString) {
      const rgbValues = rgbString.match(/\d+/g).map(Number);
      return rgbValues.length === 3 ? rgbValues : [0, 0, 0];
  }

  function outputFrames() {
      if (currentFrameIndex !== -1) {
          saveCurrentFrame();

          const framesArray = frames.map(frame => {
              return frame.map(color => {
                  const rgbValues = rgbStringToArray(color);
                  return [rgbValues];
              });
          });

          fetch('/output', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(framesArray)
          })
          .then(response => response.text())
          .then(message => alert(message))
          .catch(error => console.error('Error:', error));
      }
  }

  settingsButton.addEventListener('click', () => {
      dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
      frameMenu.style.display = 'none';
  });

  addFrameButton.addEventListener('click', () => {
      frameMenu.style.display = frameMenu.style.display === 'block' ? 'none' : 'block';
      dropdownMenu.style.display = 'none';
  });

  setButton.addEventListener('click', () => {
      const x = parseInt(xInput.value);
      const y = parseInt(yInput.value);

      if (isNaN(x) || isNaN(y) || x < 1 || x > 20 || y < 1 || y > 20) {
          alert('Please enter valid grid dimensions (1-20)');
          return;
      }

      gridWidth = x;
      gridHeight = y;
      initializeGrid();
      dropdownMenu.style.display = 'none';
  });

  newFrameButton.addEventListener('click', () => {
      addFrameToUI();
      frameMenu.style.display = 'none';
  });

  duplicateFrameButton.addEventListener('click', () => {
      duplicateFrame();
      frameMenu.style.display = 'none';
  });

  outputButton.addEventListener('click', () => {
      outputFrames();
  });

  initializeGrid();
  addFrameToUI(); // Add the initial frame
});

