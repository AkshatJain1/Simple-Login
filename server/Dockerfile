# pull official base image
FROM python:3.7.4-alpine

# set work directory
WORKDIR /usr/src/app

# install dependencies
RUN apk add --no-cache libffi-dev gcc musl-dev && pip install --upgrade pip

COPY ./requirements.txt /usr/src/app/requirements.txt
RUN pip install -r requirements.txt

# copy project
COPY . /usr/src/app/