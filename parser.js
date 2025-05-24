javascript: (async function () {
  /* --- Configuration --- */
  const DIALOG_ID = 'clipboardWordPickerBookmarklet'
  const COPIED_MESSAGE_DURATION = 1500 // ms
  const INITIAL_DIALOG_WIDTH = '350px'
  const INITIAL_DIALOG_HEIGHT = '400px'
  const MIN_DIALOG_WIDTH = '250px' // Min width for resizing
  const MIN_DIALOG_HEIGHT = '200px' // Min height for resizing
  const COPY_LINE_ICON = '📋'

  /* --- Helper Functions --- */
  function removeDialog () {
    const existingDialog = document.getElementById(DIALOG_ID)
    if (existingDialog) {
      // Clean up document-level event listeners if any were associated with this dialog instance
      // (This is a simplified cleanup; more robust would involve storing and removing specific listeners)
      document.removeEventListener('mousemove', window.currentDialogDragMove)
      document.removeEventListener('mouseup', window.currentDialogDragEnd)
      existingDialog.remove()
    }
  }

  async function getTextFromClipboardOrPrompt () {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText()
        if (text) return text
      }
    } catch (err) {
      console.warn(
        'Clipboard API readText() failed. Falling back to prompt.',
        err
      )
    }
    return prompt(
      'Could not read clipboard automatically.\nPlease paste your text here:'
    )
  }

  function showCopiedFeedback (
    element,
    originalText,
    originalBgColor,
    originalTextColor
  ) {
    element.textContent = 'Copied!'
    element.style.backgroundColor = '#d4edda'
    element.style.color = '#155724'
    setTimeout(() => {
      element.textContent = originalText
      element.style.backgroundColor = originalBgColor || ''
      element.style.color = originalTextColor || ''
    }, COPIED_MESSAGE_DURATION)
  }

  /* --- Main Logic --- */
  removeDialog()

  const clipboardText = await getTextFromClipboardOrPrompt()

  if (!clipboardText || clipboardText.trim() === '') {
    alert('No text found in clipboard or provided.')
    return
  }

  const lines = clipboardText.split(/\r?\n/).filter(line => line.trim() !== '')

  if (lines.length === 0) {
    alert('No non-empty lines found in the provided text.')
    return
  }

  /* --- Create Dialog UI --- */
  const dialog = document.createElement('div')
  dialog.id = DIALOG_ID
  Object.assign(dialog.style, {
    position: 'fixed',
    top: '20px',
    // Initial position using right, will be converted to left/top on first drag
    right: '20px',
    width: INITIAL_DIALOG_WIDTH,
    height: INITIAL_DIALOG_HEIGHT,
    minWidth: MIN_DIALOG_WIDTH,
    minHeight: MIN_DIALOG_HEIGHT,
    backgroundColor: 'white',
    border: '2px solid #007bff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    padding: '0',
    zIndex: '99999',
    fontFamily: 'Arial, sans-serif',
    fontSize: '14px',
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    resize: 'both', // Make dialog resizable
    overflow: 'hidden' // CRUCIAL for resize handle and preventing content overflow
  })

  const header = document.createElement('div')
  Object.assign(header.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    borderBottom: '1px solid #ccc',
    backgroundColor: '#f8f9fa',
    cursor: 'move', // Indicates draggable
    userSelect: 'none' // Prevent text selection in header during drag
  })

  const title = document.createElement('strong')
  title.innerHTML =
    'Clipboard Parser ⌨️ by <a href="https://t.me/xn3wb1e" target="_blank">@xn3wb1e</a> <a href="https://github.com/workwhileweb/clipboardParser" target="_blank">🕸️</a>'
  header.appendChild(title)

  const closeButton = document.createElement('button')
  closeButton.textContent = '✕'
  Object.assign(closeButton.style, {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6c757d',
    padding: '0 5px'
  })
  closeButton.onclick = removeDialog
  header.appendChild(closeButton)
  dialog.appendChild(header)

  const contentArea = document.createElement('div')
  Object.assign(contentArea.style, {
    padding: '15px',
    overflowY: 'auto', // Makes this inner area scrollable
    flexGrow: '1', // Takes up available space, crucial for resizing
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  })

  lines.forEach((originalLineText, index) => {
    const lineContainer = document.createElement('div')
    Object.assign(lineContainer.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: '1px',
      borderBottom: index < lines.length - 1 ? '1px solid #eee' : 'none',
      gap: '2px'
    })

    const wordsInLineDiv = document.createElement('div')
    Object.assign(wordsInLineDiv.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '5px',
      flexGrow: '1'
    })

    ///[.\-_]/
    const words = originalLineText
      .split(/[|#.\-_\s+]/)
      .map(w => w.trim())
      .filter(w => w.length > 0)

    if (words.length > 0) {
      words.forEach(word => {
        const wordEl = document.createElement('span')
        wordEl.textContent = word
        const originalWordBg = '#e9ecef'
        const originalWordColor = '#333'
        Object.assign(wordEl.style, {
          padding: '1px 1px',
          backgroundColor: originalWordBg,
          color: originalWordColor,
          border: '1px solid #ced4da',
          borderRadius: '2px',
          cursor: 'pointer',
          transition: 'background-color 0.2s, color 0.2s'
        })

        wordEl.onmouseover = () => (wordEl.style.backgroundColor = '#dee2e6')
        wordEl.onmouseout = () => {
          if (wordEl.textContent !== 'Copied!') {
            wordEl.style.backgroundColor = originalWordBg
          }
        }
        wordEl.onclick = async () => {
          try {
            await navigator.clipboard.writeText(word)
            showCopiedFeedback(wordEl, word, originalWordBg, originalWordColor)
          } catch (err) {
            console.error('Failed to copy word: ', err)
            alert(`Could not copy "${word}" to clipboard.`)
          }
        }
        wordsInLineDiv.appendChild(wordEl)
      })
    } else {
      const emptyLineMsg = document.createElement('span')
      emptyLineMsg.textContent = '(empty line)'
      Object.assign(emptyLineMsg.style, { fontStyle: 'italic', color: '#888' })
      wordsInLineDiv.appendChild(emptyLineMsg)
    }
    lineContainer.appendChild(wordsInLineDiv)

    const copyLineButton = document.createElement('button')
    copyLineButton.textContent = COPY_LINE_ICON
    copyLineButton.title = 'Copy full line'
    const originalButtonBg = '#007bff'
    const originalButtonColor = 'white'
    const originalButtonText = copyLineButton.textContent

    Object.assign(copyLineButton.style, {
      padding: '1px 1px',
      backgroundColor: originalButtonBg,
      color: originalButtonColor,
      border: 'none',
      borderRadius: '1px',
      cursor: 'pointer',
      fontSize: '12px',
      flexShrink: '0',
      marginLeft: '1px', // Reduced margin
      transition: 'background-color 0.2s, color 0.2s'
    })

    copyLineButton.onmouseover = () =>
      (copyLineButton.style.backgroundColor = '#0056b3')
    copyLineButton.onmouseout = () => {
      if (copyLineButton.textContent !== 'Copied!') {
        copyLineButton.style.backgroundColor = originalButtonBg
      }
    }
    copyLineButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(originalLineText)
        showCopiedFeedback(
          copyLineButton,
          originalButtonText,
          originalButtonBg,
          originalButtonColor
        )
      } catch (err) {
        console.error('Failed to copy line: ', err)
        alert(`Could not copy line to clipboard.`)
      }
    }
    lineContainer.appendChild(copyLineButton)
    contentArea.appendChild(lineContainer)
  })

  dialog.appendChild(contentArea)
  document.body.appendChild(dialog)

  /* --- Drag Functionality --- */
  let isDragging = false
  let dragStartX, dragStartY
  let dialogInitialLeft, dialogInitialTop

  // Store these functions on window to be able to remove them specifically if removeDialog is called mid-drag
  // This is a simple approach; a more encapsulated one would involve a class or object for the dialog.
  window.currentDialogDragMove = e => {
    if (!isDragging) return
    e.preventDefault()

    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY

    let newLeft = dialogInitialLeft + dx
    let newTop = dialogInitialTop + dy

    // Boundary checks (optional, but good UX)
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const dialogWidth = dialog.offsetWidth // Current width, might have been resized
    const dialogHeight = dialog.offsetHeight // Current height

    newLeft = Math.max(0, Math.min(newLeft, viewportWidth - dialogWidth))
    newTop = Math.max(0, Math.min(newTop, viewportHeight - dialogHeight))

    dialog.style.left = newLeft + 'px'
    dialog.style.top = newTop + 'px'
  }

  window.currentDialogDragEnd = () => {
    if (!isDragging) return
    isDragging = false
    document.removeEventListener('mousemove', window.currentDialogDragMove)
    document.removeEventListener('mouseup', window.currentDialogDragEnd)
    header.style.cursor = 'move'
    dialog.style.opacity = '1' // Restore full opacity
  }

  header.addEventListener('mousedown', e => {
    // Only drag with left mouse button
    if (e.button !== 0) return
    e.preventDefault() // Prevent text selection

    isDragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY

    const rect = dialog.getBoundingClientRect()
    dialogInitialLeft = rect.left
    dialogInitialTop = rect.top

    // IMPORTANT: Switch to explicit left/top positioning for reliable dragging and resizing
    dialog.style.right = '' // Clear right positioning if it was used
    dialog.style.left = dialogInitialLeft + 'px'
    dialog.style.top = dialogInitialTop + 'px'
    // Also, ensure width/height are explicitly set if they were auto or % based initially,
    // though here we use fixed px values.
    dialog.style.width = dialog.offsetWidth + 'px'
    dialog.style.height = dialog.offsetHeight + 'px'

    header.style.cursor = 'grabbing'
    dialog.style.opacity = '0.8' // Visual feedback during drag

    document.addEventListener('mousemove', window.currentDialogDragMove)
    document.addEventListener('mouseup', window.currentDialogDragEnd)
  })
})()
