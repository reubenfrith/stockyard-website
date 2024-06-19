import wkhtmltopdf from 'wkhtmltopdf';
import path from 'path';

const filePath = path.join(__dirname, 'static', 'views');

const pdfBuilder = async (
  htmlTemplate: string,
) => {
  const pdfOptions: Options = {
    dpi: 300,
    imageQuality: 300,
    headerHtml: '',
    footerHtml: '',
    marginTop: '2.3cm',
    marginBottom: '2.0cm',
    headerSpacing: 0,
    enableLocalFileAccess: true,
    orientation: "Portrait",
    userStyleSheet: path.join(filePath, `styles.css`),
  };

  const pdfStream = wkhtmltopdf(htmlTemplate, pdfOptions);

  return pdfStream;
};

interface Options {
  dpi: number;
  imageQuality: number;
  headerHtml: string;
  footerHtml: string;
  marginTop: string;
  marginBottom: string;
  headerSpacing: number;
  enableLocalFileAccess: boolean;
  orientation: "Portrait" | "Landscape";
  userStyleSheet: string;
}



export { pdfBuilder };
