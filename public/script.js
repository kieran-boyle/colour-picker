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
    gridContainer.style.gridTemplateRows = `repeat(${y}, 50px)`;

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

    if (isNaN(x) || isNaN(y) || x < 1 || x > 200 || y < 1 || y > 50) {
        alert('Please enter valid grid dimensions (1-200 columns, 1-50 rows)');
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

  let isDragging = false;
  let startX, startY, endX, endY;
  let shiftPressed = false;

  function handleMouseDown(event) {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;

    if (!shiftPressed) {
      clearSelection();
    }
  }

  function handleMouseMove(event) {
    if (isDragging) {
      endX = event.clientX;
      endY = event.clientY;

      const rectX = Math.min(startX, endX);
      const rectY = Math.min(startY, endY);
      const rectWidth = Math.abs(endX - startX);
      const rectHeight = Math.abs(endY - startY);

      highlightTilesInRectangle(rectX, rectY, rectWidth, rectHeight);
    }
  }

  function handleMouseUp(event) {
    if (isDragging) {
      isDragging = false;

      selectTilesInRectangle(startX, startY, endX, endY);
      fillSelectedCells(colorPicker.value);
    }
  }

  function clearSelection() {
    const highlightedTiles = document.querySelectorAll('.grid-item.highlighted');
    highlightedTiles.forEach(tile => {
      tile.classList.remove('highlighted');
    });
  }

  function handleCellClick(event) {
    const clickedTile = event.target;

    if (shiftPressed) {
      clickedTile.classList.toggle('highlighted');
      clickedTile.style.backgroundColor = colorPicker.value;
    } else {
      clearSelection();
      clickedTile.classList.add('highlighted');
      clickedTile.style.backgroundColor = colorPicker.value;
    }
  }

  function highlightTilesInRectangle(x, y, width, height) {
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(tile => {
      const rect = tile.getBoundingClientRect();
      const tileX = rect.left + window.scrollX;
      const tileY = rect.top + window.scrollY;

      if (
        tileX + tile.offsetWidth >= x &&
        tileX <= x + width &&
        tileY + tile.offsetHeight >= y &&
        tileY <= y + height
      ) {
        tile.classList.add('highlighted');
        tile.style.border = '2px solid red'; // Add red border
      } else {
        tile.classList.remove('highlighted');
        tile.style.border = 'none'; // Remove border
      }
    });
  }

  function selectTilesInRectangle(startX, startY, endX, endY) {
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(tile => {
      const rect = tile.getBoundingClientRect();
      const tileX = rect.left + window.scrollX;
      const tileY = rect.top + window.scrollY;

      if (
        tileX + tile.offsetWidth >= Math.min(startX, endX) &&
        tileX <= Math.max(startX, endX) &&
        tileY + tile.offsetHeight >= Math.min(startY, endY) &&
        tileY <= Math.max(startY, endY)
      ) {
        tile.classList.add('highlighted');
      }
    });
  }

  function fillSelectedCells(color) {
    const highlightedTiles = document.querySelectorAll('.grid-item.highlighted');
    highlightedTiles.forEach(tile => {
      tile.style.backgroundColor = color;
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Shift') {
      shiftPressed = true;
    }
  });

  document.addEventListener('keyup', event => {
    if (event.key === 'Shift') {
      shiftPressed = false;
    }
  });

  gridContainer.addEventListener('mousedown', (event) => {
    event.preventDefault(); // Prevent default behavior
    handleMouseDown(event); // Call your custom mouse down event handler
  });
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  initializeGrid();
  addFrameToUI(); // Add the initial frame
});