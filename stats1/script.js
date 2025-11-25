document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const questionArea = document.getElementById('question-area');
    const answerArea = document.getElementById('answer-area');
    const nextButton = document.getElementById('next-button');
    const feedbackArea = document.getElementById('feedback-area');

    // データストア
    let type1Data = []; // 種類1 (国名解答) のデータ
    let type2Data = []; // 種類2 (品目名解答) のデータ
    let currentQuestion = null;
    let correctAnswer = '';
    const NUM_CHOICES = 8;
    const DATA_PATHS = {
        'type1': 'type1.txt',
        'type2': 'type2.txt'
    };

    /**
     * テキストファイルからデータを読み込み、パースする
     */
    async function loadData() {
        try {
            // 種類1データの読み込み
            const response1 = await fetch(DATA_PATHS.type1);
            if (!response1.ok) throw new Error(`Failed to load ${DATA_PATHS.type1}`);
            const text1 = await response1.text();
            type1Data = parseType1Data(text1);

            // 種類2データの読み込み
            const response2 = await fetch(DATA_PATHS.type2);
            if (!response2.ok) throw new Error(`Failed to load ${DATA_PATHS.type2}`);
            const text2 = await response2.text();
            type2Data = parseType2Data(text2);

            console.log('Data loaded successfully.');
            // データの読み込みが完了したら最初の問題をセット
            setNextQuestion();

        } catch (error) {
            console.error('Error loading data:', error);
            questionArea.innerHTML = '<p style="color:red;">データの読み込みに失敗しました。ファイルが揃っているか確認してください。</p>';
        }
    }

    /**
     * 種類1のデータをパースする (国名 品目1 割合1% 品目2 割合2% ...)
     */
    function parseType1Data(text) {
        return text.trim().split('\n').map(line => {
            const parts = line.split(' ');
            if (parts.length < 11) return null; // データが不完全
            const data = {
                answer: parts[0], // 国名が解答
                ranking: []
            };
            for (let i = 1; i <= 5; i++) {
                data.ranking.push({
                    item: parts[2 * i - 1], // 品目名
                    ratio: parseFloat(parts[2 * i]) // 割合
                });
            }
            return data;
        }).filter(d => d !== null);
    }

    /**
     * 種類2のデータをパースする (品目名 国1 割合1% 国2 割合2% ...)
     */
    function parseType2Data(text) {
        return text.trim().split('\n').map(line => {
            const parts = line.split(' ');
            if (parts.length < 11) return null; // データが不完全
            const data = {
                answer: parts[0], // 品目名が解答
                ranking: []
            };
            for (let i = 1; i <= 5; i++) {
                data.ranking.push({
                    country: parts[2 * i - 1], // 国名
                    ratio: parseFloat(parts[2 * i]) // 割合
                });
            }
            return data;
        }).filter(d => d !== null);
    }


    /**
     * 次の問題を設定し、画面を更新する
     */
    function setNextQuestion() {
        // 全ての状態をリセット
        answerArea.innerHTML = '';
        nextButton.classList.add('hidden');
        feedbackArea.innerHTML = '';

        //const questionType = Math.random() < 0.5 ? 1 : 2; // 種類1か種類2をランダムに選択
        const questionType = 1;
        let dataArray, allAnswers;

        if (questionType === 1 && type1Data.length > 0) {
            dataArray = type1Data;
            allAnswers = type1Data.map(d => d.answer); // 全ての国名
        } else if (questionType === 2 && type2Data.length > 0) {
            dataArray = type2Data;
            allAnswers = type2Data.map(d => d.answer); // 全ての品目名
        } else {
            // どちらのデータも空の場合（通常は発生しないはず）
            questionArea.innerHTML = '<p style="color:red;">問題データが不足しています。</p>';
            return;
        }

        // ランダムに一つの問題を選択
        const randomIndex = Math.floor(Math.random() * dataArray.length);
        currentQuestion = dataArray[randomIndex];
        correctAnswer = currentQuestion.answer;

        // 問題文と表を生成
        renderQuestion(questionType, currentQuestion);

        // 選択肢を生成
        const choices = generateChoices(correctAnswer, allAnswers);
        renderChoices(choices, correctAnswer);
    }


    /**
     * 問題文と表をDOMに挿入する
     */
    function renderQuestion(type, q) {
        let questionText, tableHTML;

        if (type === 1) {
            questionText = '◆ 輸出品目のランキングが以下となる国はどこか。';
            tableHTML = `
                <table class="data-table">
                    <thead>
                        <tr><th>順位</th><th>輸出品目</th><th>総額に占める割合</th></tr>
                    </thead>
                    <tbody>
                        ${q.ranking.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.item}</td>
                                <td>${item.ratio.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else { // type === 2
            questionText = '◆ 国別生産量のランキングが以下となる品目名は何か。';
            tableHTML = `
                <table class="data-table">
                    <thead>
                        <tr><th>順位</th><th>国名</th><th>総生産量に占める割合</th></tr>
                    </thead>
                    <tbody>
                        ${q.ranking.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.country}</td>
                                <td>${item.ratio.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        questionArea.innerHTML = `
            <p>${questionText}</p>
            ${tableHTML}
        `;
    }

    /**
     * 正解を含む8つの選択肢を生成する
     */
    function generateChoices(correct, allAnswers) {
        // 正解以外の選択肢 (ダミー) を抽出
        const dummyAnswers = allAnswers.filter(ans => ans !== correct);

        // ダミーの中からランダムに (NUM_CHOICES - 1) 個を選択
        const shuffledDummies = dummyAnswers.sort(() => 0.5 - Math.random());
        const selectedDummies = shuffledDummies.slice(0, NUM_CHOICES - 1);

        // 正解とダミーを結合し、シャッフル
        const choices = [...selectedDummies, correct];
        return choices.sort(() => 0.5 - Math.random());
    }

    /**
     * 選択肢ボタンをDOMに挿入する
     */
    function renderChoices(choices, correct) {
        choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-button';
            button.textContent = choice;
            button.dataset.answer = choice; // データ属性に解答を設定
            button.addEventListener('click', () => handleAnswer(button, correct));
            answerArea.appendChild(button);
        });
    }

    /**
     * 選択肢がクリックされた時の処理
     */
    function handleAnswer(selectedButton, correct) {
        const isCorrect = selectedButton.dataset.answer === correct;

        // 1. 全ての選択肢ボタンを無効化
        document.querySelectorAll('.choice-button').forEach(btn => {
            btn.disabled = true;
            // 正解のボタンを特定し、ハイライト用のクラスを付与
            if (btn.dataset.answer === correct) {
                btn.classList.add('correct', 'highlight');
            }
        });

        // 2. 選択されたボタンに色を付けてフィードバック
        if (isCorrect) {
            selectedButton.classList.add('correct');
            feedbackArea.textContent = '✅ 正解です！';
            feedbackArea.style.color = 'var(--success-color)';
        } else {
            selectedButton.classList.add('incorrect');
            feedbackArea.textContent = `❌ 不正解... 正解は ${correct} でした。`;
            feedbackArea.style.color = 'var(--error-color)';
        }

        // 3. 「次の問題」ボタンを表示
        nextButton.classList.remove('hidden');
    }

    // 「次の問題」ボタンにイベントリスナーを設定
    nextButton.addEventListener('click', setNextQuestion);

    // クイズ開始：データをロードする
    loadData();
});