import { useState, useEffect, useRef } from "react";
import { languages } from "./components/languages.js";
import { clsx } from "clsx";
import { getFarewellText, RandomWord } from "./components/utils.js";
import Confetti from "react-confetti";

export default function AssemblyEndgame() {
    // State values
    const [currentWord, setCurrentWord] = useState(() => RandomWord());
    const [guessedLetters, setGuessedLetters] = useState([]);
    const [timeLeft, setTimeLeft] = useState(40); // Updated to 40 seconds
    const [isTimerActive, setIsTimerActive] = useState(true); // Timer starts when the game starts
    const [farewellMessage, setFarewellMessage] = useState(null); // Track the farewell message

    // useRef Hook for highlighting at end
    const newGameButtonRef = useRef(null);

    // Derived values
    const totalGuessesAllowed = languages.length - 1; // Updated to languages.length - 1
    const wrongGuessCount = guessedLetters.filter(
        (letter) => !currentWord.includes(letter)
    ).length;
    const remainingGuesses = totalGuessesAllowed - wrongGuessCount;
    const isGameWon = currentWord
        .split("")
        .every((letter) => guessedLetters.includes(letter));
    const isGameLost = wrongGuessCount >= totalGuessesAllowed || timeLeft === 0; // Lose if time runs out
    const isGameOver = isGameLost || isGameWon;
    const lastGuessedLetter = guessedLetters[guessedLetters.length - 1];
    const isLastGuessIncorrect =
        lastGuessedLetter && !currentWord.includes(lastGuessedLetter);

    // Static values
    const alphabet = "abcdefghijklmnopqrstuvwxyz";

    // Timer logic
    useEffect(() => {
        if (isTimerActive && timeLeft > 0 && !isGameOver) {
            const timerId = setTimeout(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);

            return () => clearTimeout(timerId); // Cleanup timer
        } else if (timeLeft === 0) {
            setIsTimerActive(false); // Stop the timer when time runs out
        }
    }, [timeLeft, isTimerActive, isGameOver]);

    // Update farewell message when a wrong guess is made
    useEffect(() => {
        if (isLastGuessIncorrect) {
            const newFarewellMessage = getFarewellText(languages[wrongGuessCount - 1].name);
            setFarewellMessage(newFarewellMessage);
        }
    }, [isLastGuessIncorrect, wrongGuessCount]);

    // Focus the "New Game" button when the game ends
    useEffect(() => {
        if (isGameOver && newGameButtonRef.current) {
            newGameButtonRef.current.focus(); // Focus the button
        }
    }, [isGameOver]);

    // Add keyboard event listener for guessing letters
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (isGameOver) return; // Ignore key presses if the game is over

            const key = event.key.toLowerCase(); // Convert key to lowercase
            if (/^[a-z]$/.test(key)) { // Check if the key is a valid letter (A-Z)
                addGuessedLetter(key);
            }
        };

        window.addEventListener("keydown", handleKeyDown); // Add event listener
        return () => window.removeEventListener("keydown", handleKeyDown); // Cleanup event listener
    }, [isGameOver, addGuessedLetter]);

    // Reset timer and start new game
    function startNewGame() {
        setCurrentWord(RandomWord());
        setGuessedLetters([]);
        setTimeLeft(40); // Reset timer to 40 seconds
        setIsTimerActive(true); // Reactivate the timer
        setFarewellMessage(null); // Reset farewell message
    }

    function addGuessedLetter(letter) {
        setGuessedLetters((prevLetters) =>
            prevLetters.includes(letter) ? prevLetters : [...prevLetters, letter]
        );
    }

    const langEles = languages.map((lang, index) => {
        const styles = {
            backgroundColor: lang.backgroundColor,
            color: lang.color,
        };
        const isLangLost = index < wrongGuessCount;
        const className = clsx("chip", isLangLost && "lost");

        return (
            <span className={className} style={styles} key={lang.name}>
                {lang.name}
            </span>
        );
    });

    const letterEles = currentWord.split("").map((letter, index) => {
        const shouldRevealLetter = isGameLost || guessedLetters.includes(letter);
        const letterClassName = clsx(
            isGameLost && !guessedLetters.includes(letter) && "missed-letter"
        );

        return (
            <span key={index} className={letterClassName}>
                {shouldRevealLetter ? letter.toUpperCase() : ""}
            </span>
        );
    });

    const keyboardEles = alphabet.split("").map((letter) => {
        const isGuessed = guessedLetters.includes(letter);
        const isCorrect = isGuessed && currentWord.includes(letter);
        const isWrong = isGuessed && !currentWord.includes(letter);
        const className = clsx({
            correct: isCorrect,
            wrong: isWrong,
        });

        return (
            <button
                className={className}
                key={letter}
                disabled={isGameOver}
                aria-disabled={guessedLetters.includes(letter)}
                aria-label={`Letter ${letter}`}
                onClick={() => addGuessedLetter(letter)}
            >
                {letter.toUpperCase()}
            </button>
        );
    });

    const gameStatusClass = clsx("game-status", {
        won: isGameWon,
        lost: isGameLost,
        farewell: !isGameOver && isLastGuessIncorrect,
    });

    function renderGameStatus() {
        if (!isGameOver && isLastGuessIncorrect) {
            return (
                <p className="farewell-message">
                    {farewellMessage}
                    <br />
                </p>
            );
        }

        if (isGameWon) {
            return (
                <>
                    <h2>You win!</h2>
                    <p>Well done! 🎉</p>
                </>
            );
        }
        if (isGameLost) {
            return (
                <>
                    <h2>Game over!</h2>
                    <p>
                        {timeLeft === 0
                            ? "Time's up! You ran out of time. 😭"
                            : "You lose! Better start learning Assembly 😭"}
                    </p>
                    <p>Remaining Guesses: 0</p>
                </>
            );
        }

        return null;
    }

    return (
        <main>
            {/* Confetti for winning */}
            {isGameWon && (
                <Confetti
                    recycle={false}
                    numberOfPieces={1000}
                    colors={["#FFD700", "#FFA500", "#FF6347"]} // Bright, celebratory colors
                />
            )}

            {/* Anti-confetti for losing */}
            {isGameLost && (
                <Confetti
                    recycle={false}
                    numberOfPieces={500} // Fewer pieces for a sad effect
                    gravity={0.1} // Slower fall
                    colors={["#555", "#333", "#000"]} // Darker, subdued colors
                />
            )}

            <header>
                <p>{currentWord}</p>
                <h1>Assembly: Endgame</h1>
                <p>
                    Guess the word within {totalGuessesAllowed} attempts and{" "}
                    {timeLeft} seconds to keep the programming world safe from
                    Assembly!
                </p>
            </header>

            <section
                aria-live="polite"
                role="status"
                className={gameStatusClass}
            >
                {renderGameStatus()}
            </section>

            <section className="language-chips">{langEles}</section>

            <section className="remaining-guesses">
                <p>Remaining Guesses: {remainingGuesses}</p>
                <p>Time Left: {timeLeft} seconds</p>
            </section>

            <section className="word">{letterEles}</section>

            {/* Combined visually-hidden aria-live region for status updates */}
            <section className="sr-only" aria-live="polite" role="status">
                <p>
                    {currentWord.includes(lastGuessedLetter)
                        ? `Correct! The letter ${lastGuessedLetter} is in the word.`
                        : `Sorry, the letter ${lastGuessedLetter} is not in the word.`}
                    You have {remainingGuesses} attempts left and {timeLeft}{" "}
                    seconds remaining.
                </p>
                <p>
                    Current word:{" "}
                    {currentWord
                        .split("")
                        .map((letter) =>
                            guessedLetters.includes(letter) ? letter + "." : "blank."
                        )
                        .join(" ")}
                </p>
            </section>

            <section className="keyboard">{keyboardEles}</section>

            {isGameOver && (
                <button
                    className="new-game"
                    onClick={startNewGame}
                    ref={newGameButtonRef} // Ref for focusing
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            startNewGame(); // Trigger new game on Enter/Space
                        }
                    }}
                >
                    New Game
                </button>
            )}
        </main>
    );
}