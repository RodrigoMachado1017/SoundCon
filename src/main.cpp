#include <iostream>
#include <fstream>
#include <vector>
#include <lame/lame.h>
using namespace std;

// Definição de constantes
#define IN_BUFFER_SIZE 8192
#define MP3_BUFFER_SIZE 8192

// Estrutura para o cabeçalho do arquivo WAV
struct WaveHeader {
    char chunkId[4];
    uint32_t chunkSize;
    char format[4];
    char subchunk1Id[4];
    uint32_t subchunk1Size;
    uint16_t audioFormat;
    uint16_t numChannels;
    uint32_t sampleRate;
    uint32_t byteRate;
    uint16_t blockAlign;
    uint16_t bitsPerSample;
    char subchunk2Id[4];
    uint32_t subchunk2Size;
};

// --- Função de conversão ---
void convertWavToMp3(const string& wavFilePath, const string& mp3FilePath) {
    // Abre o arquivo WAV
    ifstream wavFile(wavFilePath, ios::binary);
    if (!wavFile.is_open()) {
        cerr << "Erro: Não foi possível abrir o arquivo WAV." << endl;
        return;
    }

    // Lê e valida o cabeçalho WAV
    WaveHeader header;
    wavFile.read(reinterpret_cast<char*>(&header), sizeof(WaveHeader));
    if (header.chunkId[0] != 'R' || header.Id[1] != 'I' || header.Id[2] != 'F' || header.Id[3] != 'F' || 
        header.format[0] != 'W' || header.format[1] != 'A' || header.format[2] != 'V' || header.format[3] != 'E') {
        cerr << "Erro: O arquivo não é um WAV válido." << endl;
        wavFile.close();
        return;
    }

    // Abre o arquivo de saída MP3
    ofstream mp3File(mp3FilePath, ios::binary);
    if (!mp3File.is_open()) {
        cerr << "Erro: Não foi possível criar o arquivo MP3 de saída." << endl;
        wavFile.close();
        return;
    }

    // Inicializa o encoder LAME
    lame_t lame = lame_init();
    if (lame == NULL) {
        cerr << "Erro: Falha ao inicializar o LAME." << endl;
        wavFile.close();
        mp3File.close();
        return;
    }

    // Configura os parâmetros do LAME para alta qualidade (VBR)
    lame_set_in_samplerate(lame, header.sampleRate);
    lame_set_num_channels(lame, header.numChannels);
    lame_set_VBR(lame, vbr_default); // VBR de alta qualidade
    lame_set_quality(lame, 2);       // 0-9, onde 0 é a mais alta qualidade, mas mais lento. 2 é um bom compromisso.
    
    // Finaliza a configuração
    if (lame_init_params(lame) < 0) {
        cerr << "Erro: Falha ao inicializar os parâmetros do LAME." << endl;
        lame_close(lame);
        wavFile.close();
        mp3File.close();
        return;
    }

    // Buffers para processamento
    vector<short> pcm_buffer(IN_BUFFER_SIZE);
    vector<unsigned char> mp3_buffer(MP3_BUFFER_SIZE);
    
    cout << "Iniciando a conversão..." << endl;

    // Loop de conversão
    int read, write;
    do {
        // Lê um bloco de dados WAV
        wavFile.read(reinterpret_cast<char*>(pcm_buffer.data()), IN_BUFFER_SIZE * sizeof(short));
        read = wavFile.gcount() / sizeof(short);

        if (read == 0) {
            // Se não leu mais dados, codifica o restante e sai
            write = lame_encode_flush(lame, mp3_buffer.data(), MP3_BUFFER_SIZE);
        } else {
            // Codifica os dados lidos
            if (header.numChannels == 2) {
                // Estéreo
                write = lame_encode_buffer_interleaved(lame, pcm_buffer.data(), read, mp3_buffer.data(), MP3_BUFFER_SIZE);
            } else {
                // Mono
                write = lame_encode_buffer(lame, pcm_buffer.data(), NULL, read, mp3_buffer.data(), MP3_BUFFER_SIZE);
            }
        }
        
        // Escreve os dados MP3
        if (write > 0) {
            mp3File.write(reinterpret_cast<const char*>(mp3_buffer.data()), write);
        }

    } while (read > 0);

    // Finaliza
    lame_close(lame);
    wavFile.close();
    mp3File.close();
    cout << "Conversão concluída com sucesso!" << endl;
}

// --- Função principal (main) para teste ---
int main(int argc, char* argv[]) {
    if (argc < 3) {
        cerr << "Uso: " << argv[0] << " <caminho_arquivo_entrada.wav> <caminho_arquivo_saida.mp3>" << endl;
        return 1;
    }

    string inputPath = argv[1];
    string outputPath = argv[2];

    convertWavToMp3(inputPath, outputPath);

    return 0;
}