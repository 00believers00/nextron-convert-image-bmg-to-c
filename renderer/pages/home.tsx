import React from 'react';
import {ipcRenderer} from 'electron'
import {
    Box,
    Button,
    Container,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid,
    Radio,
    RadioGroup
} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import * as FileSaver from "file-saver";
import {DropzoneArea} from 'material-ui-dropzone';

const useStyles = makeStyles({
    button: {
        margin: 10
    },
});

function Home() {
    const classes = useStyles();

    const [selectFile, setSelectFile] = React.useState<File>(null);
    const [dataOut, setDataOut] = React.useState("");
    const [sizeImageText, setSizeImageText] = React.useState("");
    const [nameFile, setNameFile] = React.useState("");


    const [valueByteOrder, setValueByteOrder] = React.useState('big');

    const handleChangeByteOrder = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValueByteOrder((event.target as HTMLInputElement).value);
    };

    const onClickSelectFile = (files) => {
        if (files[0]) {
            setSelectFile(files[0])
            setDataOut("")
            let name = files[0].name
            const nameIndex = name.indexOf('.')
            if (nameIndex != -1) name = name.substring(0, nameIndex)
            name = name.replaceAll('-', '_')
            name = name.replaceAll(' ', '_')
            setNameFile(name)
            let img = new Image()
            img.src = window.URL.createObjectURL(files[0])
            img.onload = () => {
                setSizeImageText(img.width + "x" + img.height)
            }
        }
    }
    const onClickDeleteFile = (files) => {
        setDataOut("")
        setSizeImageText("")
        setNameFile("")
    }

    const onClickConvert = (event) => {
        if (selectFile) {
            const path = selectFile.path
            ipcRenderer.send('convert:BMGtoC', path,valueByteOrder)
            ipcRenderer.on('BMGtoC:success', (event, data) => {
                setDataOut(data)
            })
        }
    }
    const onClickDownloadFile = (event) => {
        const blob = new Blob([`\n\n\n\n\n\nconst unsigned short ${nameFile}_${sizeImageText}[] = \{\n${dataOut}\n\};`], {type: "text/plain;charset=utf-8"})
        FileSaver.saveAs(blob, `${nameFile}.c`);
    }
    return (
        <React.Fragment>
            <div>
                <title>Convert Image</title>
                <Container fixed>
                    <Grid
                        container
                        direction="column"
                        justifyContent="flex-start"
                        alignItems="center"
                    >
                        <h1>BMP 24 bit to 16 bit</h1>
                        <Box height={20}/>
                        <Grid
                            container
                            direction="row"
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <FormControl component="fieldset">
                                <FormLabel component="legend">Byte order</FormLabel>
                                <RadioGroup row aria-label="byte-order" name="row-radio-buttons-group"
                                            value={valueByteOrder} onChange={handleChangeByteOrder}>
                                    <FormControlLabel value="little" control={<Radio/>} label="Little-Endian"/>
                                    <FormControlLabel value="big" control={<Radio/>} label="Big-Endian"/>
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        <Box height={20}/>
                        <DropzoneArea
                            acceptedFiles={['image/bmp']}
                            filesLimit={1}
                            dropzoneText={"Drag and drop an image here or click"}
                            onChange={(files) => onClickSelectFile(files)}
                            onDelete={(files) => onClickDeleteFile(files)}
                        />
                        <Grid
                            container
                            direction="row"
                            justifyContent="flex-start"
                            alignItems="center"
                        >
                            <h4>Size Image {sizeImageText}</h4>
                        </Grid>

                        <Grid
                            container
                            direction="row"
                            justifyContent="flex-end"
                            alignItems="center"
                        >
                            <Button
                                variant="outlined" color="primary"
                                className={classes.button}
                                disabled={dataOut.length == 0}
                                onClick={
                                    (e) => onClickDownloadFile(e)
                                }>
                                Download File
                            </Button>

                            <Button
                                variant="outlined" color="primary"
                                className={classes.button}
                                onClick={
                                    (e) => onClickConvert(e)
                                }>
                                Convert Image
                            </Button>

                        </Grid>

                    </Grid>

                </Container>
            </div>
        </React.Fragment>
    );
}

export default Home;
